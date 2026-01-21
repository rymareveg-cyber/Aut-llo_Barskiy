"""
Роуты для работы с метриками поведения пользователей.
"""
import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime, timedelta
from core.database import get_db
from models.behavior_metrics import (
    BehaviorMetrics,
    BehaviorMetricsCreate,
    BehaviorMetricsUpdate,
    BehaviorMetricsResponse,
    BehaviorMetricsCRUD
)
from pydantic import BaseModel

router = APIRouter(prefix="/behavior-metrics", tags=["behavior-metrics"])


@router.post("/", response_model=BehaviorMetricsResponse, status_code=status.HTTP_201_CREATED)
def create_behavior_metrics(metrics: BehaviorMetricsCreate, db: Session = Depends(get_db)):
    """Создать новую запись о метриках поведения пользователя."""
    return BehaviorMetricsCRUD.create(db=db, metrics_data=metrics)


@router.get("/", response_model=List[BehaviorMetricsResponse])
def get_all_metrics(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Получить список всех записей о метриках с пагинацией."""
    metrics = BehaviorMetricsCRUD.get_all(db=db, skip=skip, limit=limit)
    return metrics


class StatisticsResponse(BaseModel):
    """Схема для ответа со статистикой."""
    avg_time_day: float
    avg_time_week: float
    avg_time_month: float
    all_cursor_positions: List[dict]


@router.get("/statistics/summary", response_model=StatisticsResponse)
def get_statistics_summary(db: Session = Depends(get_db)):
    """Получить статистику метрик: среднее время за день/неделю/месяц и все позиции курсора."""
    now = datetime.utcnow()
    
    # Среднее время за день (последние 24 часа)
    day_start = now - timedelta(days=1)
    avg_time_day = db.query(func.avg(BehaviorMetrics.time_on_page)).filter(
        BehaviorMetrics.created_at >= day_start
    ).scalar() or 0.0
    
    # Среднее время за неделю (последние 7 дней)
    week_start = now - timedelta(days=7)
    avg_time_week = db.query(func.avg(BehaviorMetrics.time_on_page)).filter(
        BehaviorMetrics.created_at >= week_start
    ).scalar() or 0.0
    
    # Среднее время за месяц (последние 30 дней)
    month_start = now - timedelta(days=30)
    avg_time_month = db.query(func.avg(BehaviorMetrics.time_on_page)).filter(
        BehaviorMetrics.created_at >= month_start
    ).scalar() or 0.0
    
    # Получаем все позиции курсора из всех записей
    all_metrics = db.query(BehaviorMetrics).filter(
        BehaviorMetrics.cursor_positions.isnot(None)
    ).all()
    
    all_cursor_positions = []
    for metric in all_metrics:
        if metric.cursor_positions:
            try:
                positions = json.loads(metric.cursor_positions)
                if isinstance(positions, list):
                    all_cursor_positions.extend(positions)
            except (json.JSONDecodeError, TypeError):
                pass
    
    return StatisticsResponse(
        avg_time_day=float(avg_time_day),
        avg_time_week=float(avg_time_week),
        avg_time_month=float(avg_time_month),
        all_cursor_positions=all_cursor_positions
    )


@router.get("/{metrics_id}", response_model=BehaviorMetricsResponse)
def get_behavior_metrics(metrics_id: int, db: Session = Depends(get_db)):
    """Получить запись о метриках по ID."""
    metrics = BehaviorMetricsCRUD.get_by_id(db=db, metrics_id=metrics_id)
    if not metrics:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"BehaviorMetrics with id {metrics_id} not found"
        )
    return metrics


@router.get("/application/{application_id}", response_model=BehaviorMetricsResponse)
def get_behavior_metrics_by_application(application_id: int, db: Session = Depends(get_db)):
    """Получить запись о метриках по application_id."""
    metrics = BehaviorMetricsCRUD.get_by_application_id(db=db, application_id=application_id)
    if not metrics:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"BehaviorMetrics for application_id {application_id} not found"
        )
    return metrics


@router.put("/{metrics_id}", response_model=BehaviorMetricsResponse)
def update_behavior_metrics(
    metrics_id: int,
    metrics: BehaviorMetricsUpdate,
    db: Session = Depends(get_db)
):
    """Обновить запись о метриках."""
    updated_metrics = BehaviorMetricsCRUD.update(
        db=db, metrics_id=metrics_id, metrics_data=metrics
    )
    if not updated_metrics:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"BehaviorMetrics with id {metrics_id} not found"
        )
    return updated_metrics


@router.put("/application/{application_id}", response_model=BehaviorMetricsResponse)
def update_behavior_metrics_by_application(
    application_id: int,
    metrics: BehaviorMetricsUpdate,
    db: Session = Depends(get_db)
):
    """Обновить запись о метриках по application_id."""
    updated_metrics = BehaviorMetricsCRUD.update_by_application_id(
        db=db, application_id=application_id, metrics_data=metrics
    )
    if not updated_metrics:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"BehaviorMetrics for application_id {application_id} not found"
        )
    return updated_metrics


@router.delete("/{metrics_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_behavior_metrics(metrics_id: int, db: Session = Depends(get_db)):
    """Удалить запись о метриках."""
    success = BehaviorMetricsCRUD.delete(db=db, metrics_id=metrics_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"BehaviorMetrics with id {metrics_id} not found"
        )
    return None

