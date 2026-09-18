from datetime import datetime
from typing import List

from pydantic import BaseModel, ConfigDict


class SiteMetricResponse(BaseModel):
    id: str
    site_id: str
    recorded_at: datetime
    carbon_sequestration_rate_tco2e_per_ha: float
    cumulative_carbon_tco2e: float
    biodiversity_index: float
    species_richness_count: int
    ndvi: float
    canopy_cover_percentage: float
    soil_organic_carbon_pct: float
    sensor_source: str
    model_config = ConfigDict(from_attributes=True)


class SiteAnalyticsSummary(BaseModel):
    site_id: str
    site_name: str
    area_hectares: float
    biome: str
    total_cumulative_carbon_tco2e: float
    current_annual_rate_tco2e: float
    latest_biodiversity_index: float
    latest_species_richness: int
    latest_ndvi: float
    latest_canopy_cover_pct: float
    latest_soil_carbon_pct: float
    history_months: int
    time_series: List[SiteMetricResponse]


class ProjectAnalyticsSummary(BaseModel):
    project_id: str
    project_name: str
    total_sites: int
    total_area_hectares: float
    total_cumulative_carbon_tco2e: float
    annual_carbon_run_rate_tco2e: float
    average_biodiversity_index: float
    average_ndvi: float
    average_canopy_cover_pct: float
    time_series_aggregate: List[dict]
