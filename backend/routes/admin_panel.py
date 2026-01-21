"""
Роуты для админ-панели (защищенные).
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db
from core.auth import get_current_admin
from models.admin import Admin, AdminResponse, AdminUpdate, AdminCRUD
from models.applications import Application, ApplicationResponse, ApplicationCRUD
from models.admin_settings import AdminSettings, AdminSettingsCreate, AdminSettingsUpdate, AdminSettingsResponse, AdminSettingsCRUD
from core.security import get_password_hash

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/admins", response_model=List[AdminResponse])
def get_all_admins(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """Получить список всех администраторов."""
    admins = AdminCRUD.get_all(db=db, skip=skip, limit=limit)
    return admins


@router.get("/admins/{admin_id}", response_model=AdminResponse)
def get_admin(
    admin_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """Получить администратора по ID."""
    admin = AdminCRUD.get_by_id(db=db, admin_id=admin_id)
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Администратор с id {admin_id} не найден"
        )
    return admin


@router.put("/admins/{admin_id}", response_model=AdminResponse)
def update_admin(
    admin_id: int,
    admin_data: AdminUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """Обновить администратора."""
    # Проверяем, что обновляется существующий администратор
    existing_admin = AdminCRUD.get_by_id(db=db, admin_id=admin_id)
    if not existing_admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Администратор с id {admin_id} не найден"
        )
    
    # Проверяем уникальность username, если он обновляется
    if admin_data.username and admin_data.username != existing_admin.username:
        username_exists = AdminCRUD.get_by_username(db=db, username=admin_data.username)
        if username_exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Пользователь с таким username уже существует"
            )
    
    # Проверяем уникальность email, если он обновляется
    if admin_data.email and admin_data.email != existing_admin.email:
        email_exists = AdminCRUD.get_by_email(db=db, email=admin_data.email)
        if email_exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Пользователь с таким email уже существует"
            )
    
    # Хешируем пароль, если он обновляется
    hashed_password = None
    if admin_data.password:
        hashed_password = get_password_hash(admin_data.password)
    
    updated_admin = AdminCRUD.update(
        db=db,
        admin_id=admin_id,
        admin_data=admin_data,
        hashed_password=hashed_password
    )
    
    return updated_admin


@router.delete("/admins/{admin_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_admin(
    admin_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """Удалить администратора."""
    # Не позволяем удалить самого себя
    if admin_id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нельзя удалить самого себя"
        )
    
    # Проверяем, что останется хотя бы один администратор
    admin_count = AdminCRUD.count(db=db)
    if admin_count <= 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нельзя удалить последнего администратора"
        )
    
    success = AdminCRUD.delete(db=db, admin_id=admin_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Администратор с id {admin_id} не найден"
        )
    return None


@router.get("/applications", response_model=List[ApplicationResponse])
def get_all_applications(
    skip: int = 0,
    limit: int = 100,
    sort_by_temperature: bool = True,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """Получить список всех заявок (для админ-панели)."""
    applications = ApplicationCRUD.get_all(
        db=db, 
        skip=skip, 
        limit=limit,
        sort_by_temperature=sort_by_temperature
    )
    return applications


@router.get("/applications/statistics")
def get_applications_statistics(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """Получить статистику по заявкам."""
    from models.temperature_analysis import calculate_temperature_score
    from collections import Counter
    from models.applications import Application
    
    # Получаем заявки напрямую из базы, без использования CRUD для избежания проблем с валидацией
    applications = db.query(Application).all()
    
    total = len(applications)
    temperature_counts = Counter()
    department_counts = Counter()
    total_budget = 0.0
    budgets_by_temp = {"hot": 0.0, "medium": 0.0, "cold": 0.0}
    
    for app in applications:
        try:
            score, temperature, department = calculate_temperature_score(
                business_niche=app.business_niche,
                company_size=app.company_size,
                task_volume=app.task_volume,
                role=app.role,
                deadline=app.deadline,
                budget=float(app.budget) if app.budget else None
            )
            temperature_counts[temperature] += 1
            department_counts[department] += 1
            
            if app.budget:
                budget_value = float(app.budget)
                total_budget += budget_value
                budgets_by_temp[temperature] += budget_value
        except Exception as e:
            # Пропускаем заявки с ошибками расчета
            continue
    
    return {
        "total": total,
        "by_temperature": {
            "hot": temperature_counts.get("hot", 0),
            "medium": temperature_counts.get("medium", 0),
            "cold": temperature_counts.get("cold", 0)
        },
        "by_department": dict(department_counts),
        "total_budget": total_budget,
        "budgets_by_temperature": budgets_by_temp,
        "average_budget": total_budget / total if total > 0 else 0.0
    }


@router.get("/applications/{application_id}", response_model=ApplicationResponse)
def get_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """Получить заявку по ID (для админ-панели)."""
    application = ApplicationCRUD.get_by_id(db=db, application_id=application_id)
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Заявка с id {application_id} не найдена"
        )
    return application


@router.delete("/applications/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """Удалить заявку (для админ-панели)."""
    success = ApplicationCRUD.delete(db=db, application_id=application_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Заявка с id {application_id} не найдена"
        )
    return None


# Роуты для управления услугами (admin_settings) в админ-панели
@router.get("/services", response_model=List[AdminSettingsResponse])
def get_all_services(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """Получить список всех услуг (для админ-панели)."""
    services = AdminSettingsCRUD.get_all(db=db, skip=skip, limit=limit)
    return services


@router.post("/services", response_model=AdminSettingsResponse, status_code=status.HTTP_201_CREATED)
def create_service(
    service_data: AdminSettingsCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """Создать новую услугу (для админ-панели)."""
    return AdminSettingsCRUD.create(db=db, settings_data=service_data)


@router.put("/services/{service_id}", response_model=AdminSettingsResponse)
def update_service(
    service_id: int,
    service_data: AdminSettingsUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """Обновить услугу (для админ-панели)."""
    updated_service = AdminSettingsCRUD.update(
        db=db, settings_id=service_id, settings_data=service_data
    )
    if not updated_service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Услуга с id {service_id} не найдена"
        )
    return updated_service


@router.delete("/services/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_service(
    service_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """Удалить услугу (для админ-панели)."""
    success = AdminSettingsCRUD.delete(db=db, settings_id=service_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Услуга с id {service_id} не найдена"
        )
    return None

