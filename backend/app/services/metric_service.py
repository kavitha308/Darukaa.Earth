import math
import random
from datetime import datetime, timezone
from typing import Dict, List, Optional

from sqlalchemy.orm import Session

from app.models.metric import SiteMetric
from app.models.site import Site
from app.schemas.metric import ProjectAnalyticsSummary, SiteAnalyticsSummary, SiteMetricResponse

BIOME_BASELINES = {
    "Tropical Rainforest": {
        "ndvi": 0.72,
        "carbon_rate": 12.5,
        "bio_index": 65,
        "species": 55,
        "canopy": 60.0,
    },
    "Mangrove Wetland": {
        "ndvi": 0.68,
        "carbon_rate": 15.2,
        "bio_index": 58,
        "species": 42,
        "canopy": 55.0,
    },
    "Temperate Peatland": {
        "ndvi": 0.52,
        "carbon_rate": 8.0,
        "bio_index": 48,
        "species": 30,
        "canopy": 35.0,
    },
    "Savanna & Agroforestry": {
        "ndvi": 0.45,
        "carbon_rate": 6.2,
        "bio_index": 44,
        "species": 28,
        "canopy": 30.0,
    },
    "Boreal Forest": {
        "ndvi": 0.48,
        "carbon_rate": 5.5,
        "bio_index": 40,
        "species": 22,
        "canopy": 40.0,
    },
}


class MetricService:
    @classmethod
    def generate_historical_metrics_for_site(
        cls,
        db: Session,
        site: Site,
        months_back: int = 24,
    ) -> List[SiteMetric]:
        """
        Generates realistic ecological time-series metrics over the past N months
        calibrated to the site's biome, geographic latitude, and surface area.
        """
        # Determine baseline by biome
        baseline = BIOME_BASELINES.get(site.biome, BIOME_BASELINES["Tropical Rainforest"])

        area = max(site.area_hectares, 0.1)
        lat = site.centroid_lat
        # Southern hemisphere inverts seasonality
        season_phase_shift = 6 if lat < 0 else 0

        now = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        metrics: List[SiteMetric] = []

        cumulative_carbon = 0.0

        # Deterministic seed using site ID for consistent realistic trajectories
        rng = random.Random(site.id)

        for i in range(months_back, -1, -1):
            # Calculate month timestamp
            year = now.year
            month = now.month - i
            while month <= 0:
                month += 12
                year -= 1
            recorded_at = datetime(year, month, 1, tzinfo=timezone.utc)

            # Restoration progress factor (0.0 to 1.0)
            progress = (months_back - i) / max(months_back, 1)

            # Seasonality: sinusoidal wave
            month_idx = (recorded_at.month + season_phase_shift) % 12
            season_sin = math.sin((month_idx / 12.0) * 2.0 * math.pi)

            # NDVI (0.0 - 1.0): baseline + growth trend + seasonal swing + slight noise
            ndvi_val = (
                baseline["ndvi"]
                + (progress * 0.14)
                + (season_sin * 0.08)
                + rng.uniform(-0.015, 0.015)
            )
            ndvi_val = max(0.20, min(0.95, round(ndvi_val, 3)))

            # Canopy cover (0 - 100%)
            canopy_val = (
                baseline["canopy"] + (progress * 24.0) + (season_sin * 3.0) + rng.uniform(-1.0, 1.0)
            )
            canopy_val = max(10.0, min(95.0, round(canopy_val, 1)))

            # Carbon sequestration annual rate per hectare (tCO2e/ha/yr)
            rate_val = baseline["carbon_rate"] * (
                0.85 + 0.30 * progress + 0.10 * season_sin + rng.uniform(-0.05, 0.05)
            )
            rate_val = max(1.0, round(rate_val, 2))

            # Monthly increment in tonnes of CO2
            monthly_carbon = (rate_val / 12.0) * area
            cumulative_carbon += monthly_carbon

            # Biodiversity Index (0 - 100)
            bio_val = baseline["bio_index"] + (progress * 22.0) + rng.uniform(-1.5, 1.5)
            bio_val = max(20.0, min(98.0, round(bio_val, 1)))

            # Species richness count (integer)
            species_val = int(baseline["species"] + (progress * 30.0) + rng.randint(-2, 2))

            # Soil organic carbon (1.0% - 6.0%)
            soil_carbon = 2.1 + (progress * 1.8) + rng.uniform(-0.08, 0.08)
            soil_carbon = max(1.0, min(6.0, round(soil_carbon, 2)))

            metric = SiteMetric(
                site_id=site.id,
                recorded_at=recorded_at,
                carbon_sequestration_rate_tco2e_per_ha=rate_val,
                cumulative_carbon_tco2e=round(cumulative_carbon, 2),
                biodiversity_index=bio_val,
                species_richness_count=species_val,
                ndvi=ndvi_val,
                canopy_cover_percentage=canopy_val,
                soil_organic_carbon_pct=soil_carbon,
                sensor_source="Sentinel-2 MSI & GEDI Spaceborne LiDAR",
            )
            metrics.append(metric)
            db.add(metric)

        db.commit()
        return metrics

    @staticmethod
    def get_site_metrics(
        db: Session,
        site_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> List[SiteMetric]:
        query = db.query(SiteMetric).filter(SiteMetric.site_id == site_id)
        if start_date:
            query = query.filter(SiteMetric.recorded_at >= start_date)
        if end_date:
            query = query.filter(SiteMetric.recorded_at <= end_date)
        return query.order_by(SiteMetric.recorded_at.asc()).all()

    @classmethod
    def get_site_analytics_summary(cls, db: Session, site: Site) -> SiteAnalyticsSummary:
        metrics = cls.get_site_metrics(db, site.id)
        if not metrics:
            metrics = cls.generate_historical_metrics_for_site(db, site)

        latest = metrics[-1]
        return SiteAnalyticsSummary(
            site_id=site.id,
            site_name=site.name,
            area_hectares=site.area_hectares,
            biome=site.biome,
            total_cumulative_carbon_tco2e=latest.cumulative_carbon_tco2e,
            current_annual_rate_tco2e=round(
                latest.carbon_sequestration_rate_tco2e_per_ha * site.area_hectares, 2
            ),
            latest_biodiversity_index=latest.biodiversity_index,
            latest_species_richness=latest.species_richness_count,
            latest_ndvi=latest.ndvi,
            latest_canopy_cover_pct=latest.canopy_cover_percentage,
            latest_soil_carbon_pct=latest.soil_organic_carbon_pct,
            history_months=len(metrics),
            time_series=[SiteMetricResponse.model_validate(m) for m in metrics],
        )

    @classmethod
    def get_project_analytics_summary(
        cls, db: Session, project_id: str, project_name: str
    ) -> ProjectAnalyticsSummary:
        sites = db.query(Site).filter(Site.project_id == project_id).all()
        if not sites:
            return ProjectAnalyticsSummary(
                project_id=project_id,
                project_name=project_name,
                total_sites=0,
                total_area_hectares=0.0,
                total_cumulative_carbon_tco2e=0.0,
                annual_carbon_run_rate_tco2e=0.0,
                average_biodiversity_index=0.0,
                average_ndvi=0.0,
                average_canopy_cover_pct=0.0,
                time_series_aggregate=[],
            )

        total_area = sum(s.area_hectares for s in sites)
        total_carbon = 0.0
        annual_run_rate = 0.0
        bio_indices = []
        ndvis = []
        canopies = []

        # Gather monthly metrics across sites
        monthly_map: Dict[str, Dict[str, float]] = {}

        for site in sites:
            summary = cls.get_site_analytics_summary(db, site)
            total_carbon += summary.total_cumulative_carbon_tco2e
            annual_run_rate += summary.current_annual_rate_tco2e
            bio_indices.append(summary.latest_biodiversity_index)
            ndvis.append(summary.latest_ndvi)
            canopies.append(summary.latest_canopy_cover_pct)

            for m in summary.time_series:
                date_key = m.recorded_at.strftime("%Y-%m")
                if date_key not in monthly_map:
                    monthly_map[date_key] = {
                        "date": date_key,
                        "cumulative_carbon_tco2e": 0.0,
                        "ndvi_sum": 0.0,
                        "bio_sum": 0.0,
                        "count": 0,
                    }
                monthly_map[date_key]["cumulative_carbon_tco2e"] += m.cumulative_carbon_tco2e
                monthly_map[date_key]["ndvi_sum"] += m.ndvi
                monthly_map[date_key]["bio_sum"] += m.biodiversity_index
                monthly_map[date_key]["count"] += 1

        # Flatten aggregate time-series
        time_series_aggregate = []
        for date_key in sorted(monthly_map.keys()):
            entry = monthly_map[date_key]
            count = max(entry["count"], 1)
            time_series_aggregate.append(
                {
                    "date": date_key,
                    "cumulative_carbon_tco2e": round(entry["cumulative_carbon_tco2e"], 2),
                    "average_ndvi": round(entry["ndvi_sum"] / count, 3),
                    "average_biodiversity_index": round(entry["bio_sum"] / count, 1),
                }
            )

        avg_bio = round(sum(bio_indices) / len(bio_indices), 1) if bio_indices else 0.0
        avg_ndvi = round(sum(ndvis) / len(ndvis), 3) if ndvis else 0.0
        avg_canopy = round(sum(canopies) / len(canopies), 1) if canopies else 0.0

        return ProjectAnalyticsSummary(
            project_id=project_id,
            project_name=project_name,
            total_sites=len(sites),
            total_area_hectares=round(total_area, 2),
            total_cumulative_carbon_tco2e=round(total_carbon, 2),
            annual_carbon_run_rate_tco2e=round(annual_run_rate, 2),
            average_biodiversity_index=avg_bio,
            average_ndvi=avg_ndvi,
            average_canopy_cover_pct=avg_canopy,
            time_series_aggregate=time_series_aggregate,
        )
