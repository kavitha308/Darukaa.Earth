from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid


class SiteMetric(Base, TimestampMixin):
    __tablename__ = "site_metrics"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    site_id = Column(
        String(36), ForeignKey("sites.id", ondelete="CASCADE"), nullable=False, index=True
    )

    recorded_at = Column(DateTime(timezone=True), nullable=False, index=True)

    # Ecological & Carbon Metrics
    carbon_sequestration_rate_tco2e_per_ha = Column(Float, nullable=False, default=0.0)
    cumulative_carbon_tco2e = Column(Float, nullable=False, default=0.0)
    biodiversity_index = Column(Float, nullable=False, default=0.0)  # 0 - 100
    species_richness_count = Column(Integer, nullable=False, default=0)
    ndvi = Column(Float, nullable=False, default=0.0)  # 0.0 - 1.0
    canopy_cover_percentage = Column(Float, nullable=False, default=0.0)  # 0 - 100%
    soil_organic_carbon_pct = Column(Float, nullable=False, default=0.0)

    sensor_source = Column(String(100), nullable=False, default="Sentinel-2 & Biomass LiDAR")

    site = relationship("Site", back_populates="metrics")
