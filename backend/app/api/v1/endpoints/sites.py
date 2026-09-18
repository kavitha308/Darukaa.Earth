from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_admin, get_current_user, get_db
from app.models.project import Project
from app.models.user import User
from app.schemas.site import SiteCreate, SiteFeatureCollectionResponse, SiteFeatureResponse
from app.services.metric_service import MetricService
from app.services.site_service import SiteService

router = APIRouter(prefix="/sites", tags=["Sites"])


@router.get("", response_model=SiteFeatureCollectionResponse)
def list_sites(
    project_id: Optional[str] = Query(None, description="Filter sites by project ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List all sites as a GeoJSON FeatureCollection.
    Directly ingestible by Mapbox GL JS sources and layers.
    """
    if project_id:
        sites = SiteService.get_sites_by_project(db, project_id)
    else:
        sites = SiteService.get_all_sites(db)

    features = [s.to_feature() for s in sites]
    return {
        "type": "FeatureCollection",
        "features": features,
    }


@router.post("", response_model=SiteFeatureResponse, status_code=status.HTTP_201_CREATED)
def create_site(
    site_in: SiteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new geographical site within a project from a GeoJSON Polygon.
    Computes geodetic area in hectares, centroid, and seeds realistic historical metrics.
    """
    project = db.query(Project).filter(Project.id == site_in.project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parent project not found",
        )

    try:
        site = SiteService.create_site(db, site_in)
        # Seed realistic monthly ecological time-series metrics
        MetricService.generate_historical_metrics_for_site(db, site)
        return site.to_feature()
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e


@router.get("/{site_id}", response_model=SiteFeatureResponse)
def get_site(
    site_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get single site as GeoJSON Feature."""
    site = SiteService.get_by_id(db, site_id)
    if not site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Site not found",
        )
    return site.to_feature()


@router.delete("/{site_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_site(
    site_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """Delete a site and its corresponding metrics."""
    site = SiteService.get_by_id(db, site_id)
    if not site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Site not found",
        )
    SiteService.delete_site(db, site)
    return None
