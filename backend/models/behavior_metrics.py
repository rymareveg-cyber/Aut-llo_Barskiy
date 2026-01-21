"""
Модель для хранения метрик поведения пользователя на странице.
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Float
from sqlalchemy.sql import func
from core.database import Base


class BehaviorMetrics(Base):
    """
    Модель метрик поведения пользователя.
    Анонимные метрики - application_id просто сохраняется как число без проверок.
    
    SQL код для генерации таблицы:
    
    CREATE TABLE behavior_metrics (
        id SERIAL PRIMARY KEY,
        application_id INTEGER DEFAULT 0,
        time_on_page FLOAT DEFAULT 0.0,
        buttons_clicked TEXT,
        cursor_positions TEXT,
        return_frequency INTEGER DEFAULT 0,
        page_views INTEGER DEFAULT 0,
        scroll_depth FLOAT DEFAULT 0.0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    """
    __tablename__ = "behavior_metrics"

    id = Column(Integer, primary_key=True, index=True)
    # application_id теперь просто число без ограничений - для анонимных метрик
    application_id = Column(Integer, default=0, nullable=True)
    
    # Метрики поведения
    time_on_page = Column(Float, default=0.0)  # double precision для времени на странице
    buttons_clicked = Column(String, nullable=True)  # character varying без длины
    cursor_positions = Column(String, nullable=True)  # character varying без длины
    return_frequency = Column(Integer, default=0)  # сколько раз вернулся на страницу
    page_views = Column(Integer, default=0)  # количество просмотров страницы
    scroll_depth = Column(Float, default=0.0)  # глубина прокрутки (0.0 - 1.0)
    
    # Временные метки
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class BehaviorMetricsCreate(BaseModel):
    """Схема для создания записи о метриках поведения."""
    application_id: Optional[int] = 0  # Анонимные метрики - application_id просто игнорируется
    time_on_page: Optional[float] = 0.0
    buttons_clicked: Optional[str] = None
    cursor_positions: Optional[str] = None
    return_frequency: Optional[int] = 0
    page_views: Optional[int] = 0
    scroll_depth: Optional[float] = 0.0


class BehaviorMetricsUpdate(BaseModel):
    """Схема для обновления записи о метриках поведения."""
    time_on_page: Optional[float] = None
    buttons_clicked: Optional[str] = None
    cursor_positions: Optional[str] = None
    return_frequency: Optional[int] = None
    page_views: Optional[int] = None
    scroll_depth: Optional[float] = None


class BehaviorMetricsResponse(BaseModel):
    """Схема для ответа с данными о метриках поведения."""
    id: int
    application_id: Optional[int] = 0  # Может быть NULL для анонимных метрик
    time_on_page: float
    buttons_clicked: Optional[str] = None
    cursor_positions: Optional[str] = None
    return_frequency: int
    page_views: int
    scroll_depth: float
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class BehaviorMetricsCRUD:
    """CRUD операции для модели BehaviorMetrics."""
    
    @staticmethod
    def create(db: Session, metrics_data: BehaviorMetricsCreate) -> BehaviorMetrics:
        """Создать новую запись о метриках поведения."""
        db_metrics = BehaviorMetrics(**metrics_data.model_dump())
        db.add(db_metrics)
        db.commit()
        db.refresh(db_metrics)
        return db_metrics
    
    @staticmethod
    def get_by_id(db: Session, metrics_id: int) -> Optional[BehaviorMetrics]:
        """Получить запись о метриках по ID."""
        return db.query(BehaviorMetrics).filter(BehaviorMetrics.id == metrics_id).first()
    
    @staticmethod
    def get_by_application_id(db: Session, application_id: int) -> Optional[BehaviorMetrics]:
        """Получить запись о метриках по application_id."""
        return db.query(BehaviorMetrics).filter(BehaviorMetrics.application_id == application_id).first()
    
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[BehaviorMetrics]:
        """Получить все записи о метриках с пагинацией."""
        return db.query(BehaviorMetrics).offset(skip).limit(limit).all()
    
    @staticmethod
    def update(db: Session, metrics_id: int, metrics_data: BehaviorMetricsUpdate) -> Optional[BehaviorMetrics]:
        """Обновить запись о метриках."""
        db_metrics = db.query(BehaviorMetrics).filter(BehaviorMetrics.id == metrics_id).first()
        if not db_metrics:
            return None
        
        update_data = metrics_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_metrics, key, value)
        
        db.commit()
        db.refresh(db_metrics)
        return db_metrics
    
    @staticmethod
    def update_by_application_id(db: Session, application_id: int, metrics_data: BehaviorMetricsUpdate) -> Optional[BehaviorMetrics]:
        """Обновить запись о метриках по application_id."""
        db_metrics = db.query(BehaviorMetrics).filter(BehaviorMetrics.application_id == application_id).first()
        if not db_metrics:
            return None
        
        update_data = metrics_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_metrics, key, value)
        
        db.commit()
        db.refresh(db_metrics)
        return db_metrics
    
    @staticmethod
    def delete(db: Session, metrics_id: int) -> bool:
        """Удалить запись о метриках."""
        db_metrics = db.query(BehaviorMetrics).filter(BehaviorMetrics.id == metrics_id).first()
        if not db_metrics:
            return False
        
        db.delete(db_metrics)
        db.commit()
        return True

