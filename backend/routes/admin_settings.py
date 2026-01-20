"""
Роуты для работы с административными настройками.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db
from models.admin_settings import (
    AdminSettings,
    AdminSettingsCreate,
    AdminSettingsUpdate,
    AdminSettingsResponse,
    AdminSettingsCRUD
)

router = APIRouter(prefix="/admin-settings", tags=["admin-settings"])


@router.post("/", response_model=AdminSettingsResponse, status_code=status.HTTP_201_CREATED)
def create_admin_settings(settings: AdminSettingsCreate, db: Session = Depends(get_db)):
    """Создать новую административную настройку."""
    return AdminSettingsCRUD.create(db=db, settings_data=settings)


@router.get("/", response_model=List[AdminSettingsResponse])
def get_all_settings(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Получить список всех административных настроек с пагинацией."""
    settings = AdminSettingsCRUD.get_all(db=db, skip=skip, limit=limit)
    return settings


@router.get("/{settings_id}", response_model=AdminSettingsResponse)
def get_admin_settings(settings_id: int, db: Session = Depends(get_db)):
    """Получить административную настройку по ID."""
    settings = AdminSettingsCRUD.get_by_id(db=db, settings_id=settings_id)
    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AdminSettings with id {settings_id} not found"
        )
    return settings


@router.put("/{settings_id}", response_model=AdminSettingsResponse)
def update_admin_settings(
    settings_id: int,
    settings: AdminSettingsUpdate,
    db: Session = Depends(get_db)
):
    """Обновить административную настройку."""
    updated_settings = AdminSettingsCRUD.update(
        db=db, settings_id=settings_id, settings_data=settings
    )
    if not updated_settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AdminSettings with id {settings_id} not found"
        )
    return updated_settings


@router.delete("/{settings_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_admin_settings(settings_id: int, db: Session = Depends(get_db)):
    """Удалить административную настройку."""
    success = AdminSettingsCRUD.delete(db=db, settings_id=settings_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AdminSettings with id {settings_id} not found"
        )
    return None

