"""
Модель для хранения администраторов системы.
"""
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from core.database import Base


class Admin(Base):
    """
    Модель администратора.
    
    SQL код для генерации таблицы:
    
    CREATE TABLE admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        hashed_password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    """
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator


class AdminCreate(BaseModel):
    """Схема для создания администратора."""
    username: str
    email: EmailStr
    password: str
    
    @field_validator('username')
    @classmethod
    def validate_username(cls, v):
        """Проверяем, что username не пустой и имеет минимум 3 символа."""
        if not v or not v.strip():
            raise ValueError('Username не может быть пустым')
        if len(v.strip()) < 3:
            raise ValueError('Username должен содержать минимум 3 символа')
        return v.strip()
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        """Проверяем, что пароль не пустой и имеет минимум 6 символов."""
        if not v or not v.strip():
            raise ValueError('Пароль не может быть пустым')
        if len(v.strip()) < 6:
            raise ValueError('Пароль должен содержать минимум 6 символов')
        return v.strip()


class AdminUpdate(BaseModel):
    """Схема для обновления администратора."""
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    
    @field_validator('username')
    @classmethod
    def validate_username(cls, v):
        """Проверяем, что username не пустой и имеет минимум 3 символа."""
        if v is not None:
            if not v.strip():
                raise ValueError('Username не может быть пустым')
            if len(v.strip()) < 3:
                raise ValueError('Username должен содержать минимум 3 символа')
            return v.strip()
        return v
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        """Проверяем, что пароль не пустой и имеет минимум 6 символов."""
        if v is not None:
            if not v.strip():
                raise ValueError('Пароль не может быть пустым')
            if len(v.strip()) < 6:
                raise ValueError('Пароль должен содержать минимум 6 символов')
            return v.strip()
        return v


class AdminResponse(BaseModel):
    """Схема для ответа с данными администратора (без пароля)."""
    id: int
    username: str
    email: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AdminLogin(BaseModel):
    """Схема для входа администратора."""
    username: str
    password: str


class AdminCRUD:
    """CRUD операции для модели Admin."""
    
    @staticmethod
    def create(db: Session, admin_data: AdminCreate, hashed_password: str) -> Admin:
        """Создать нового администратора."""
        db_admin = Admin(
            username=admin_data.username,
            email=admin_data.email,
            hashed_password=hashed_password
        )
        db.add(db_admin)
        db.commit()
        db.refresh(db_admin)
        return db_admin
    
    @staticmethod
    def get_by_id(db: Session, admin_id: int) -> Optional[Admin]:
        """Получить администратора по ID."""
        return db.query(Admin).filter(Admin.id == admin_id).first()
    
    @staticmethod
    def get_by_username(db: Session, username: str) -> Optional[Admin]:
        """Получить администратора по username."""
        return db.query(Admin).filter(Admin.username == username).first()
    
    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[Admin]:
        """Получить администратора по email."""
        return db.query(Admin).filter(Admin.email == email).first()
    
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[Admin]:
        """Получить всех администраторов с пагинацией."""
        return db.query(Admin).order_by(Admin.created_at.desc()).offset(skip).limit(limit).all()
    
    @staticmethod
    def count(db: Session) -> int:
        """Получить количество администраторов."""
        return db.query(Admin).count()
    
    @staticmethod
    def update(db: Session, admin_id: int, admin_data: AdminUpdate, hashed_password: Optional[str] = None) -> Optional[Admin]:
        """Обновить администратора."""
        db_admin = db.query(Admin).filter(Admin.id == admin_id).first()
        if not db_admin:
            return None
        
        update_data = admin_data.model_dump(exclude_unset=True, exclude={'password'})
        for key, value in update_data.items():
            setattr(db_admin, key, value)
        
        if hashed_password:
            db_admin.hashed_password = hashed_password
        
        db.commit()
        db.refresh(db_admin)
        return db_admin
    
    @staticmethod
    def delete(db: Session, admin_id: int) -> bool:
        """Удалить администратора."""
        db_admin = db.query(Admin).filter(Admin.id == admin_id).first()
        if not db_admin:
            return False
        
        db.delete(db_admin)
        db.commit()
        return True

