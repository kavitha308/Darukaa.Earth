import math
from typing import List, Optional, Tuple

from geoalchemy2.elements import WKTElement
from shapely.geometry import Polygon as ShapelyPolygon
from sqlalchemy.orm import Session

from app.core.database import is_sqlite
from app.models.site import Site
from app.schemas.site import SiteCreate

EARTH_RADIUS_METERS = 6371008.8  # IUGG authalic mean radius


def calculate_spherical_polygon_area_hectares(coordinates: List[List[float]]) -> float:
    """
    Computes geodetic surface area in hectares for a closed polygon on Earth's surface.
    Uses spherical excess (Gauss-Bonnet theorem) for geodesic accuracy without GIS projection distortion.
    """
    if len(coordinates) < 4:
        return 0.0

    total_area_sq_meters = 0.0
    num_pts = len(coordinates)

    # Outer ring coordinates: [lng, lat] in degrees
    for i in range(num_pts - 1):
        p1 = coordinates[i]
        p2 = coordinates[i + 1]

        lon1_rad = math.radians(p1[0])
        lat1_rad = math.radians(p1[1])
        lon2_rad = math.radians(p2[0])
        lat2_rad = math.radians(p2[1])

        # Spherical polygon trapezoidal integration
        total_area_sq_meters += (lon2_rad - lon1_rad) * (
            2.0 + math.sin(lat1_rad) + math.sin(lat2_rad)
        )

    total_area_sq_meters = abs(total_area_sq_meters * (EARTH_RADIUS_METERS**2) / 2.0)
    # Convert square meters to hectares (1 ha = 10,000 m²)
    area_hectares = total_area_sq_meters / 10000.0
    return round(area_hectares, 4)


class SiteService:
    @staticmethod
    def parse_and_validate_polygon(
        coords: List[List[List[float]]],
    ) -> Tuple[ShapelyPolygon, float, float, float, List[float]]:
        """
        Validates GeoJSON polygon coordinates, returns:
        (shapely_polygon, area_hectares, centroid_lat, centroid_lng, bbox)
        """
        try:
            poly = ShapelyPolygon(coords[0], coords[1:] if len(coords) > 1 else None)
        except Exception as e:
            raise ValueError(f"Invalid polygon geometry: {str(e)}") from e

        if not poly.is_valid:
            poly = poly.buffer(0)
            if not poly.is_valid:
                raise ValueError("Polygon self-intersects or has degenerate topology.")

        centroid = poly.centroid
        centroid_lat = centroid.y
        centroid_lng = centroid.x
        minx, miny, maxx, maxy = poly.bounds
        bbox = [round(minx, 6), round(miny, 6), round(maxx, 6), round(maxy, 6)]

        area_ha = calculate_spherical_polygon_area_hectares(coords[0])
        if area_ha <= 0.0001:
            area_ha = 0.01  # Minimum threshold for micro-plots

        return poly, round(area_ha, 2), round(centroid_lat, 6), round(centroid_lng, 6), bbox

    @classmethod
    def create_site(cls, db: Session, site_in: SiteCreate) -> Site:
        poly, area_ha, centroid_lat, centroid_lng, bbox = cls.parse_and_validate_polygon(
            site_in.geometry.coordinates
        )

        wkt_str = poly.wkt
        geom_val = wkt_str if is_sqlite else WKTElement(wkt_str, srid=4326)

        site = Site(
            project_id=site_in.project_id,
            name=site_in.name.strip(),
            description=site_in.description.strip() if site_in.description else None,
            geometry=geom_val,
            area_hectares=area_ha,
            centroid_lat=centroid_lat,
            centroid_lng=centroid_lng,
            bbox=bbox,
            biome=site_in.biome or "Tropical Rainforest",
        )
        db.add(site)
        db.commit()
        db.refresh(site)
        return site

    @staticmethod
    def get_by_id(db: Session, site_id: str) -> Optional[Site]:
        return db.query(Site).filter(Site.id == site_id).first()

    @staticmethod
    def get_sites_by_project(db: Session, project_id: str) -> List[Site]:
        return db.query(Site).filter(Site.project_id == project_id).all()

    @staticmethod
    def get_all_sites(db: Session) -> List[Site]:
        return db.query(Site).all()

    @staticmethod
    def delete_site(db: Session, site: Site) -> None:
        db.delete(site)
        db.commit()
