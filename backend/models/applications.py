"""
Модель для хранения заявок от клиентов (applications).
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Numeric
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from core.database import Base


class Application(Base):
    """
    Модель заявки клиента.
    
    SQL код для генерации таблицы:
    
    CREATE TABLE applications (
        id SERIAL PRIMARY KEY,
        service_id INTEGER REFERENCES admin_settings(id) ON DELETE SET NULL,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        phone VARCHAR(255),
        email VARCHAR(255),
        comments TEXT,
        business_niche VARCHAR(255),
        company_size VARCHAR(50),
        task_volume VARCHAR(50),
        role VARCHAR(255),
        deadline VARCHAR(255),
        budget NUMERIC(15, 2),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    """
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    # Связь с услугой (из admin_settings)
    service_id = Column(Integer, ForeignKey("admin_settings.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Контактные данные
    first_name = Column(String(255), nullable=False)
    last_name = Column(String(255), nullable=False)
    phone = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    
    # Дополнительная информация
    comments = Column(Text, nullable=True)
    
    # Поля для анализа температуры льда
    business_niche = Column(String(255), nullable=True)  # Ниша бизнеса
    company_size = Column(String(50), nullable=True)  # Размер компании (startup, small, medium, large, enterprise)
    task_volume = Column(String(50), nullable=True)  # Объем задачи (small, medium, large, enterprise)
    role = Column(String(255), nullable=True)  # Роль заполняющего (CEO, CTO, Manager, etc.)
    deadline = Column(String(255), nullable=True)  # Сроки (urgent, 1-2 weeks, 1 month, flexible)
    budget = Column(Numeric(15, 2), nullable=True)  # Бюджет
    
    # Временные метки
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Связь с услугой (из admin_settings)
    service = relationship("AdminSettings", foreign_keys=[service_id])


from sqlalchemy.orm import Session
from typing import Optional, List, Dict
from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator, model_validator
from models.temperature_analysis import calculate_temperature_score, get_temperature_info


class ApplicationCreate(BaseModel):
    """Схема для создания заявки."""
    service_id: Optional[int] = None
    first_name: str
    last_name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    comments: Optional[str] = None
    business_niche: Optional[str] = None
    company_size: Optional[str] = None
    task_volume: Optional[str] = None
    role: Optional[str] = None
    deadline: Optional[str] = None
    budget: Optional[float] = None
    
    @field_validator('first_name', 'last_name')
    @classmethod
    def validate_name(cls, v):
        """Проверяем, что имя не пустое."""
        if not v or not v.strip():
            raise ValueError('Имя и фамилия не могут быть пустыми')
        return v.strip()
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        """Проверяем формат email, если указан."""
        if v and '@' not in v:
            raise ValueError('Некорректный формат email')
        return v
    
    @model_validator(mode='after')
    def validate_contact(self):
        """Проверяем, что указан хотя бы один контакт."""
        if not self.phone and not self.email:
            raise ValueError('Необходимо указать телефон или email')
        return self


class ApplicationUpdate(BaseModel):
    """Схема для обновления заявки."""
    service_id: Optional[int] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    comments: Optional[str] = None
    business_niche: Optional[str] = None
    company_size: Optional[str] = None
    task_volume: Optional[str] = None
    role: Optional[str] = None
    deadline: Optional[str] = None
    budget: Optional[float] = None


class ApplicationResponse(BaseModel):
    """Схема для ответа с данными заявки."""
    id: int
    service_id: Optional[int] = None
    first_name: str
    last_name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    comments: Optional[str] = None
    business_niche: Optional[str] = None
    company_size: Optional[str] = None
    task_volume: Optional[str] = None
    role: Optional[str] = None
    deadline: Optional[str] = None
    budget: Optional[float] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    # Вычисляемые поля для температуры
    temperature_score: Optional[int] = None
    temperature: Optional[str] = None
    department: Optional[str] = None
    temperature_info: Optional[Dict[str, str]] = None
    
    @model_validator(mode='after')
    def calculate_temperature_fields(self):
        """Вычисляет поля температуры после создания модели."""
        try:
            score, temperature, department = calculate_temperature_score(
                business_niche=self.business_niche,
                company_size=self.company_size,
                task_volume=self.task_volume,
                role=self.role,
                deadline=self.deadline,
                budget=self.budget
            )
            self.temperature_score = score
            self.temperature = temperature
            self.department = department
            self.temperature_info = get_temperature_info(temperature)
        except Exception:
            # Если произошла ошибка, устанавливаем значения по умолчанию
            self.temperature_score = 0
            self.temperature = "cold"
            self.department = "Общий отдел"
            self.temperature_info = get_temperature_info("cold")
        return self

    class Config:
        from_attributes = True


class ApplicationCRUD:
    """CRUD операции для модели Application."""
    
    @staticmethod
    def create(db: Session, application_data: ApplicationCreate) -> Application:
        """Создать новую заявку."""
        db_application = Application(**application_data.model_dump())
        db.add(db_application)
        db.commit()
        db.refresh(db_application)
        return db_application
    
    @staticmethod
    def get_by_id(db: Session, application_id: int) -> Optional[Application]:
        """Получить заявку по ID."""
        return db.query(Application).filter(Application.id == application_id).first()
    
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100, sort_by_temperature: bool = True) -> List[Application]:
        """Получить все заявки с пагинацией."""
        query = db.query(Application)
        
        if sort_by_temperature:
            # Сортируем по температуре (hot -> medium -> cold)
            from models.temperature_analysis import calculate_temperature_score
            
            # Создаем функцию для сортировки
            # В SQLAlchemy сложно сортировать по вычисляемому полю, поэтому
            # будем сортировать в Python после получения данных
            applications = query.offset(skip).limit(limit * 3).all()  # Берем больше для сортировки
            
            # Сортируем по температуре
            def get_temp_score(app):
                score, _, _ = calculate_temperature_score(
                    business_niche=app.business_niche,
                    company_size=app.company_size,
                    task_volume=app.task_volume,
                    role=app.role,
                    deadline=app.deadline,
                    budget=float(app.budget) if app.budget else None
                )
                return score
            
            applications.sort(key=get_temp_score, reverse=True)
            return applications[:limit]
        else:
            return query.order_by(Application.created_at.desc()).offset(skip).limit(limit).all()
    
    @staticmethod
    def update(db: Session, application_id: int, application_data: ApplicationUpdate) -> Optional[Application]:
        """Обновить заявку."""
        db_application = db.query(Application).filter(Application.id == application_id).first()
        if not db_application:
            return None
        
        update_data = application_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_application, key, value)
        
        db.commit()
        db.refresh(db_application)
        return db_application
    
    @staticmethod
    def delete(db: Session, application_id: int) -> bool:
        """Удалить заявку."""
        db_application = db.query(Application).filter(Application.id == application_id).first()
        if not db_application:
            return False
        
        db.delete(db_application)
        db.commit()
        return True
