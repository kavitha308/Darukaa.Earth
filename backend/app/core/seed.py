import logging

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import get_password_hash
from app.models.project import Project
from app.models.user import User
from app.schemas.site import GeoJSONPolygon, SiteCreate
from app.services.metric_service import MetricService
from app.services.site_service import SiteService

logger = logging.getLogger("darukaa.seed")

# Seed data polygons for 3 realistic ecological restoration projects
FLAGSHIP_PROJECTS = [
    {
        "name": "Sundarbans Mangrove Blue Carbon Reserve",
        "description": "Restoration of degraded coastal mangrove ecosystems to maximize tidal carbon sequestration and protect critically endangered Bengal tigers and estuarine dolphins.",
        "project_type": "Mangrove Restoration",
        "country": "Bangladesh",
        "sites": [
            {
                "name": "Karamjal Tidal Estuary Zone",
                "description": "High-density Rhizophora and Avicennia mangrove afforestation on active intertidal mudflats.",
                "biome": "Mangrove Wetland",
                "polygon": [
                    [89.5850, 22.4200],
                    [89.6100, 22.4250],
                    [89.6250, 22.4050],
                    [89.5950, 22.3950],
                    [89.5850, 22.4200],
                ],
            },
            {
                "name": "Kotka Wildlife Sanctuary Buffer",
                "description": "Canopy enrichment and salinity regulation corridor bordering pristine Sundarbans mangrove stands.",
                "biome": "Mangrove Wetland",
                "polygon": [
                    [89.7200, 21.8700],
                    [89.7500, 21.8850],
                    [89.7650, 21.8600],
                    [89.7350, 21.8450],
                    [89.7200, 21.8700],
                ],
            },
        ],
    },
    {
        "name": "Amazonian Bio-Corridor Initiative",
        "description": "Connecting fragmented primary rainforest patches in the Xingu river basin to rebuild gene flow for jaguars, harpy eagles, and canopy pollinators.",
        "project_type": "Reforestation",
        "country": "Brazil",
        "sites": [
            {
                "name": "Xingu Headwaters Bio-Corridor A",
                "description": "Native hardwood reforestation including Bertholletia excelsa (Brazil nut) and Dipteryx odorata.",
                "biome": "Tropical Rainforest",
                "polygon": [
                    [-52.3500, -3.2200],
                    [-52.3100, -3.2100],
                    [-52.2900, -3.2450],
                    [-52.3400, -3.2600],
                    [-52.3500, -3.2200],
                ],
            },
            {
                "name": "Terra do Meio Agroforestry Sector",
                "description": "Community-managed agroforestry buffer integrating native cacao, açaí palms, and timber trees.",
                "biome": "Tropical Rainforest",
                "polygon": [
                    [-52.4200, -3.3100],
                    [-52.3800, -3.2950],
                    [-52.3700, -3.3350],
                    [-52.4150, -3.3450],
                    [-52.4200, -3.3100],
                ],
            },
        ],
    },
    {
        "name": "Cairngorms Caledonian Forest Rewilding",
        "description": "Large-scale regeneration of Scotland's native Scots Pine and birch woodlands, re-wetting damaged peatlands to halt carbon leakage.",
        "project_type": "Peatland Conservation",
        "country": "United Kingdom",
        "sites": [
            {
                "name": "Glen Feshie Regeneration Plot",
                "description": "Highland deer exclosure zone allowing natural regeneration of Pinus sylvestris and Betula pendula.",
                "biome": "Temperate Peatland",
                "polygon": [
                    [-3.9100, 57.0600],
                    [-3.8700, 57.0750],
                    [-3.8500, 57.0500],
                    [-3.8950, 57.0350],
                    [-3.9100, 57.0600],
                ],
            },
        ],
    },
]


def seed_initial_data(db: Session) -> None:
    """Seeds initial superuser and flagship projects if database is empty."""
    admin_user = db.query(User).filter(User.email == settings.FIRST_SUPERUSER_EMAIL.lower()).first()
    if not admin_user:
        admin_user = User(
            email=settings.FIRST_SUPERUSER_EMAIL.lower(),
            hashed_password=get_password_hash(settings.FIRST_SUPERUSER_PASSWORD),
            full_name=settings.FIRST_SUPERUSER_NAME,
            role="admin",
            is_active=True,
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        logger.info(f"Created default admin user: {admin_user.email}")

    project_count = db.query(Project).count()
    if project_count == 0:
        logger.info("Database has no projects. Seeding flagship projects and sites...")
        for p_data in FLAGSHIP_PROJECTS:
            project = Project(
                name=p_data["name"],
                description=p_data["description"],
                project_type=p_data["project_type"],
                country=p_data["country"],
                status="active",
                owner_id=admin_user.id,
            )
            db.add(project)
            db.commit()
            db.refresh(project)

            for s_data in p_data["sites"]:
                site_in = SiteCreate(
                    project_id=project.id,
                    name=s_data["name"],
                    description=s_data["description"],
                    geometry=GeoJSONPolygon(type="Polygon", coordinates=[s_data["polygon"]]),
                    biome=s_data["biome"],
                )
                site = SiteService.create_site(db, site_in)
                MetricService.generate_historical_metrics_for_site(db, site)
                logger.info(f"Seeded site: {site.name} ({site.area_hectares} ha)")
