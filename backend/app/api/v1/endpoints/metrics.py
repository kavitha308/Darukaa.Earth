from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.project import Project
from app.models.site import Site
from app.models.user import User
from app.schemas.metric import ProjectAnalyticsSummary, SiteAnalyticsSummary, SiteMetricResponse
from app.services.metric_service import MetricService

router = APIRouter(tags=["Analytics & Metrics"])


@router.get("/sites/{site_id}/metrics", response_model=List[SiteMetricResponse])
def get_site_metrics(
    site_id: str,
    start_date: Optional[datetime] = Query(None, description="ISO format start date"),
    end_date: Optional[datetime] = Query(None, description="ISO format end date"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve raw historical time-series metrics for a given site."""
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Site not found",
        )
    metrics = MetricService.get_site_metrics(db, site_id, start_date, end_date)
    return metrics


@router.get("/sites/{site_id}/analytics", response_model=SiteAnalyticsSummary)
def get_site_analytics(
    site_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve comprehensive analytics summary and complete historical time-series
    for rendering interactive carbon and biodiversity charts.
    """
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Site not found",
        )
    summary = MetricService.get_site_analytics_summary(db, site)
    return summary


@router.get("/projects/{project_id}/analytics", response_model=ProjectAnalyticsSummary)
def get_project_analytics(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve aggregated analytics across all sites within a project,
    including run-rate carbon sequestration and portfolio-level trends.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    summary = MetricService.get_project_analytics_summary(db, project_id, project.name)
    return summary
