from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.site import Site
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate


class ProjectService:
    @staticmethod
    def get_by_id(db: Session, project_id: str) -> Optional[Project]:
        return db.query(Project).filter(Project.id == project_id).first()

    @staticmethod
    def get_all(db: Session, owner_id: Optional[str] = None) -> List[ProjectResponse]:
        query = db.query(Project)
        if owner_id:
            query = query.filter(Project.owner_id == owner_id)
        projects = query.order_by(Project.created_at.desc()).all()

        results: List[ProjectResponse] = []
        for p in projects:
            sites = db.query(Site).filter(Site.project_id == p.id).all()
            site_count = len(sites)
            total_area = sum(s.area_hectares for s in sites)

            results.append(
                ProjectResponse(
                    id=p.id,
                    name=p.name,
                    description=p.description,
                    project_type=p.project_type,
                    country=p.country,
                    status=p.status,
                    owner_id=p.owner_id,
                    site_count=site_count,
                    total_area_hectares=round(total_area, 2),
                    created_at=p.created_at,
                    updated_at=p.updated_at,
                )
            )
        return results

    @staticmethod
    def create(db: Session, project_in: ProjectCreate, owner_id: str) -> Project:
        project = Project(
            name=project_in.name.strip(),
            description=project_in.description.strip() if project_in.description else None,
            project_type=project_in.project_type,
            country=project_in.country,
            status=project_in.status or "active",
            owner_id=owner_id,
        )
        db.add(project)
        db.commit()
        db.refresh(project)
        return project

    @staticmethod
    def update(db: Session, project: Project, project_in: ProjectUpdate) -> Project:
        update_data = project_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(project, field, value)
        db.commit()
        db.refresh(project)
        return project

    @staticmethod
    def delete(db: Session, project: Project) -> None:
        db.delete(project)
        db.commit()
