"""
Роуты для работы с метриками поведения пользователей.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db
from models.behavior_metrics import (
    BehaviorMetrics,
    BehaviorMetricsCreate,
    BehaviorMetricsUpdate,
    BehaviorMetricsResponse,
    BehaviorMetricsCRUD
)

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

