export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  project_type: string;
  country: string;
  status: string;
  owner_id: string;
  site_count: number;
  total_area_hectares: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectDetail extends Project {
  sites: SiteSummary[];
}

export interface ProjectCreateInput {
  name: string;
  description?: string;
  project_type: string;
  country: string;
}

export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][]; // [lng, lat]
}

export interface SiteProperties {
  id: string;
  project_id: string;
  name: string;
  description?: string | null;
  area_hectares: number;
  centroid_lat: number;
  centroid_lng: number;
  bbox?: number[] | null;
  biome: string;
  created_at?: string | null;
}

export interface SiteFeature {
  type: 'Feature';
  id: string;
  geometry: GeoJSONPolygon;
  properties: SiteProperties;
}

export interface SiteFeatureCollection {
  type: 'FeatureCollection';
  features: SiteFeature[];
}

export interface SiteSummary {
  id: string;
  project_id: string;
  name: string;
  description?: string | null;
  area_hectares: number;
  centroid_lat: number;
  centroid_lng: number;
  bbox?: number[] | null;
  biome: string;
  created_at: string;
}

export interface SiteCreateInput {
  project_id: string;
  name: string;
  description?: string;
  geometry: GeoJSONPolygon;
  biome?: string;
}

export interface SiteMetric {
  id: string;
  site_id: string;
  recorded_at: string;
  carbon_sequestration_rate_tco2e_per_ha: number;
  cumulative_carbon_tco2e: number;
  biodiversity_index: number;
  species_richness_count: number;
  ndvi: number;
  canopy_cover_percentage: number;
  soil_organic_carbon_pct: number;
  sensor_source: string;
}

export interface SiteAnalyticsSummary {
  site_id: string;
  site_name: string;
  area_hectares: number;
  biome: string;
  total_cumulative_carbon_tco2e: number;
  current_annual_rate_tco2e: number;
  latest_biodiversity_index: number;
  latest_species_richness: number;
  latest_ndvi: number;
  latest_canopy_cover_pct: number;
  latest_soil_carbon_pct: number;
  history_months: number;
  time_series: SiteMetric[];
}

export interface ProjectAnalyticsSummary {
  project_id: string;
  project_name: string;
  total_sites: number;
  total_area_hectares: number;
  total_cumulative_carbon_tco2e: number;
  annual_carbon_run_rate_tco2e: number;
  average_biodiversity_index: number;
  average_ndvi: number;
  average_canopy_cover_pct: number;
  time_series_aggregate: Array<{
    date: string;
    cumulative_carbon_tco2e: number;
    average_ndvi: number;
    average_biodiversity_index: number;
  }>;
}
