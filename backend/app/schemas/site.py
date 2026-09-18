from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class GeoJSONPolygon(BaseModel):
    type: Literal["Polygon"] = "Polygon"
    coordinates: List[List[List[float]]] = Field(
        ...,
        description="Linear rings: list of [lng, lat] coordinate pairs. Outer ring must be closed.",
        examples=[
            [
                [-122.4194, 37.7749],
                [-122.4194, 37.7849],
                [-122.4094, 37.7849],
                [-122.4094, 37.7749],
                [-122.4194, 37.7749],
            ]
        ],
    )

    @field_validator("coordinates")
    @classmethod
    def validate_polygon_closure(cls, v: List[List[List[float]]]) -> List[List[List[float]]]:
        if not v or len(v) < 1:
            raise ValueError("Polygon must contain at least one ring")
        outer_ring = v[0]
        if len(outer_ring) < 4:
            raise ValueError("Outer ring must contain at least 4 coordinates")
        # Check if first and last point match (closed ring)
        first_pt, last_pt = outer_ring[0], outer_ring[-1]
        if abs(first_pt[0] - last_pt[0]) > 1e-6 or abs(first_pt[1] - last_pt[1]) > 1e-6:
            # Auto-close ring for user convenience
            outer_ring.append([first_pt[0], first_pt[1]])
        return v


class SiteCreate(BaseModel):
    project_id: str
    name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    geometry: GeoJSONPolygon
    biome: Optional[str] = "Tropical Rainforest"


class SiteUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    biome: Optional[str] = None


class SiteSummary(BaseModel):
    id: str
    project_id: str
    name: str
    description: Optional[str] = None
    area_hectares: float
    centroid_lat: float
    centroid_lng: float
    bbox: Optional[List[float]] = None
    biome: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SiteProperties(BaseModel):
    id: str
    project_id: str
    name: str
    description: Optional[str] = None
    area_hectares: float
    centroid_lat: float
    centroid_lng: float
    bbox: Optional[List[float]] = None
    biome: str
    created_at: Optional[str] = None


class SiteFeatureResponse(BaseModel):
    type: Literal["Feature"] = "Feature"
    id: str
    geometry: Dict[str, Any]
    properties: SiteProperties


class SiteFeatureCollectionResponse(BaseModel):
    type: Literal["FeatureCollection"] = "FeatureCollection"
    features: List[SiteFeatureResponse]
