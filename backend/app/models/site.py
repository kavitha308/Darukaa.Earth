import json
from typing import Any, Dict

from geoalchemy2 import Geometry, WKBElement
from shapely import wkb as shapely_wkb
from shapely import wkt as shapely_wkt
from shapely.geometry import mapping
from sqlalchemy import JSON, Column, Float, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base, is_sqlite
from app.models.base import TimestampMixin, generate_uuid


def get_geometry_column():
    """Returns PostGIS Geometry on PostgreSQL or Text on SQLite."""
    if not is_sqlite:
        return Geometry(geometry_type="POLYGON", srid=4326, spatial_index=True)
    return Text


class Site(Base, TimestampMixin):
    __tablename__ = "sites"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(
        String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # PostGIS Polygon geometry (SRID 4326) or WKT/GeoJSON string on SQLite
    geometry = Column(get_geometry_column(), nullable=False)

    area_hectares = Column(Float, nullable=False, default=0.0)
    centroid_lat = Column(Float, nullable=False, default=0.0)
    centroid_lng = Column(Float, nullable=False, default=0.0)
    bbox = Column(JSON, nullable=True)  # [min_lng, min_lat, max_lng, max_lat]
    biome = Column(String(100), nullable=False, default="Tropical Rainforest")

    project = relationship("Project", back_populates="sites")
    metrics = relationship(
        "SiteMetric",
        back_populates="site",
        cascade="all, delete-orphan",
        order_by="SiteMetric.recorded_at.asc()",
    )

    @property
    def geojson_geometry(self) -> Dict[str, Any]:
        """Convert stored geometry (WKB, WKT, GeoJSON string, or dict) to GeoJSON geometry dict."""
        if not self.geometry:
            return {"type": "Polygon", "coordinates": []}

        geom_val = self.geometry
        if isinstance(geom_val, WKBElement):
            shp = shapely_wkb.loads(bytes(geom_val.data))
            return mapping(shp)
        elif isinstance(geom_val, str):
            # Try parsing as JSON first
            if geom_val.strip().startswith("{"):
                try:
                    return json.loads(geom_val)
                except Exception:
                    pass
            # Try parsing as WKT
            try:
                shp = shapely_wkt.loads(geom_val)
                return mapping(shp)
            except Exception:
                pass
        elif isinstance(geom_val, dict):
            return geom_val

        return {"type": "Polygon", "coordinates": []}

    def to_feature(self) -> Dict[str, Any]:
        """Export as standard GeoJSON Feature."""
        return {
            "type": "Feature",
            "id": self.id,
            "geometry": self.geojson_geometry,
            "properties": {
                "id": self.id,
                "project_id": self.project_id,
                "name": self.name,
                "description": self.description,
                "area_hectares": round(self.area_hectares, 2),
                "centroid_lat": round(self.centroid_lat, 6),
                "centroid_lng": round(self.centroid_lng, 6),
                "bbox": self.bbox,
                "biome": self.biome,
                "created_at": self.created_at.isoformat() if self.created_at else None,
            },
        }
