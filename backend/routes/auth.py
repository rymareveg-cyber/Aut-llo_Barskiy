"""
Роуты для аутентификации администраторов.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import verify_password, get_password_hash, create_access_token
from core.auth import get_current_admin
from models.admin import Admin, AdminCreate, AdminLogin, AdminResponse, AdminCRUD
from datetime import timedelta

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AdminResponse, status_code=status.HTTP_201_CREATED)
def register(admin_data: AdminCreate, db: Session = Depends(get_db)):
    """
    Регистрация нового администратора.
    Доступна только если в базе нет ни одного администратора.
    """
    try:
        # Проверяем, есть ли уже администраторы
        admin_count = AdminCRUD.count(db=db)
        if admin_count > 0:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Регистрация недоступна. Администраторы уже существуют."
            )
        
        # Проверяем, не существует ли уже пользователь с таким username
        existing_admin = AdminCRUD.get_by_username(db=db, username=admin_data.username)
        if existing_admin:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Пользователь с таким username уже существует"
            )
        
        # Проверяем, не существует ли уже пользователь с таким email
        existing_admin = AdminCRUD.get_by_email(db=db, email=admin_data.email)
        if existing_admin:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Пользователь с таким email уже существует"
            )
        
        # Хешируем пароль и создаем администратора
        hashed_password = get_password_hash(admin_data.password)
        admin = AdminCRUD.create(db=db, admin_data=admin_data, hashed_password=hashed_password)
        
        return AdminResponse.model_validate(admin)
    except HTTPException:
        raise
    except Exception as e:
        # Логируем ошибку для отладки
        import traceback
        print(f"Ошибка при регистрации: {e}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при регистрации: {str(e)}"
        )


@router.post("/login")
def login(admin_login: AdminLogin, db: Session = Depends(get_db)):
    """
    Вход администратора. Возвращает JWT токен.
    """
    # Ищем администратора по username
    admin = AdminCRUD.get_by_username(db=db, username=admin_login.username)
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный username или пароль"
        )
    
    # Проверяем пароль
    if not verify_password(admin_login.password, admin.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный username или пароль"
        )
    
    # Создаем токен
    access_token_expires = timedelta(minutes=60 * 24)  # 24 часа
    access_token = create_access_token(
        data={"sub": admin.username},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "admin": AdminResponse.model_validate(admin)
    }


@router.get("/me", response_model=AdminResponse)
def get_current_admin_info(current_admin: Admin = Depends(get_current_admin)):
    """
    Получить информацию о текущем администраторе.
    """
    return current_admin


@router.get("/check-registration")
def check_registration(db: Session = Depends(get_db)):
    """
    Проверяет, доступна ли регистрация (есть ли хотя бы один администратор).
    """
    admin_count = AdminCRUD.count(db=db)
    return {
        "registration_available": admin_count == 0,
        "admin_count": admin_count
    }

