"""
Модель для хранения административных настроек приложения.
"""
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from core.database import Base


class AdminSettings(Base):
    """
    Модель административных настроек.
    
    SQL код для генерации таблицы:
    
    CREATE TABLE admin_settings (
        id SERIAL PRIMARY KEY,
        services CHARACTER VARYING,
        budget_range CHARACTER VARYING,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    """
    __tablename__ = "admin_settings"

    id = Column(Integer, primary_key=True, index=True)
    services = Column(String, nullable=True)
    budget_range = Column(String, nullable=True)
    
    # Временные метки
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class AdminSettingsCreate(BaseModel):
    """Схема для создания настроек."""
    services: Optional[str] = None
    budget_range: Optional[str] = None


class AdminSettingsUpdate(BaseModel):
    """Схема для обновления настроек."""
    services: Optional[str] = None
    budget_range: Optional[str] = None


class AdminSettingsResponse(BaseModel):
    """Схема для ответа с данными настроек."""
    id: int
    services: Optional[str] = None
    budget_range: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AdminSettingsCRUD:
    """CRUD операции для модели AdminSettings."""
    
    @staticmethod
    def create(db: Session, settings_data: AdminSettingsCreate) -> AdminSettings:
        """Создать новую настройку."""
        db_settings = AdminSettings(**settings_data.model_dump())
        db.add(db_settings)
        db.commit()
        db.refresh(db_settings)
        return db_settings
    
    @staticmethod
    def get_by_id(db: Session, settings_id: int) -> Optional[AdminSettings]:
        """Получить настройку по ID."""
        return db.query(AdminSettings).filter(AdminSettings.id == settings_id).first()
    
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[AdminSettings]:
        """Получить все настройки с пагинацией."""
        return db.query(AdminSettings).offset(skip).limit(limit).all()
    
    @staticmethod
    def update(db: Session, settings_id: int, settings_data: AdminSettingsUpdate) -> Optional[AdminSettings]:
        """Обновить настройку."""
        db_settings = db.query(AdminSettings).filter(AdminSettings.id == settings_id).first()
        if not db_settings:
            return None
        
        update_data = settings_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_settings, key, value)
        
        db.commit()
        db.refresh(db_settings)
        return db_settings
    
    @staticmethod
    def delete(db: Session, settings_id: int) -> bool:
        """Удалить настройку."""
        db_settings = db.query(AdminSettings).filter(AdminSettings.id == settings_id).first()
        if not db_settings:
            return False
        
        db.delete(db_settings)
        db.commit()
        return True

