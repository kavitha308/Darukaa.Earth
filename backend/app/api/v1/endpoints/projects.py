from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_admin, get_current_user, get_db
from app.models.site import Site
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectDetailResponse, ProjectResponse, ProjectUpdate
from app.schemas.site import SiteSummary
from app.services.project_service import ProjectService

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("", response_model=List[ProjectResponse])
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all projects with their site counts and total area in hectares."""
    return ProjectService.get_all(db)


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    project_in: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """Create a new carbon/biodiversity project."""
    project = ProjectService.create(db, project_in, owner_id=current_user.id)
    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        project_type=project.project_type,
        country=project.country,
        status=project.status,
        owner_id=project.owner_id,
        site_count=0,
        total_area_hectares=0.0,
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


@router.get("/{project_id}", response_model=ProjectDetailResponse)
def get_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve project details along with its associated geographical sites."""
    project = ProjectService.get_by_id(db, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    sites = db.query(Site).filter(Site.project_id == project.id).all()
    total_area = sum(s.area_hectares for s in sites)

    return ProjectDetailResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        project_type=project.project_type,
        country=project.country,
        status=project.status,
        owner_id=project.owner_id,
        site_count=len(sites),
        total_area_hectares=round(total_area, 2),
        created_at=project.created_at,
        updated_at=project.updated_at,
        sites=[SiteSummary.model_validate(s) for s in sites],
    )


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: str,
    project_in: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """Update project metadata."""
    project = ProjectService.get_by_id(db, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    updated = ProjectService.update(db, project, project_in)
    sites = db.query(Site).filter(Site.project_id == updated.id).all()

    return ProjectResponse(
        id=updated.id,
        name=updated.name,
        description=updated.description,
        project_type=updated.project_type,
        country=updated.country,
        status=updated.status,
        owner_id=updated.owner_id,
        site_count=len(sites),
        total_area_hectares=round(sum(s.area_hectares for s in sites), 2),
        created_at=updated.created_at,
        updated_at=updated.updated_at,
    )


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """Delete project and all associated sites and metrics."""
    project = ProjectService.get_by_id(db, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    ProjectService.delete(db, project)
    return None
