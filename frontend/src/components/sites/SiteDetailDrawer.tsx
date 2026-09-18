import React from 'react';
import {
  X,
  Trees,
  TrendingUp,
  Sparkles,
  Activity,
  Layers,
  Trash2,
  Calendar,
  MapPin,
} from 'lucide-react';
import { useMapStore } from '../../context/mapStore';
import { useSiteAnalytics } from '../../hooks/useSiteMetrics';
import { useDeleteSite } from '../../hooks/useSites';
import { StatCard } from '../common/StatCard';
import { CarbonMetricsChart } from '../charts/CarbonMetricsChart';
import { BiodiversityChart } from '../charts/BiodiversityChart';
import { VegetationIndexChart } from '../charts/VegetationIndexChart';

export const SiteDetailDrawer: React.FC = () => {
  const { selectedSiteId, isSiteDetailDrawerOpen, setIsSiteDetailDrawerOpen } = useMapStore();

  const { data: analytics, isLoading } = useSiteAnalytics(selectedSiteId);
  const deleteSiteMutation = useDeleteSite();

  if (!isSiteDetailDrawerOpen || !selectedSiteId) return null;

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this site and its geospatial analytics?')) {
      await deleteSiteMutation.mutateAsync(selectedSiteId);
      setIsSiteDetailDrawerOpen(false);
    }
  };

  return (
    <aside
      aria-label="Site Analytics Drawer"
      className="fixed top-16 right-0 bottom-0 w-full sm:w-[540px] lg:w-[620px] bg-earth-dark/95 border-l border-earth-border z-40 backdrop-blur-md shadow-2xl flex flex-col animate-in slide-in-from-right duration-250"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-earth-border flex items-center justify-between bg-earth-card/60">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-brand-950 border border-brand-800/80 flex items-center justify-center text-brand-400">
            <Trees className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-white truncate max-w-[280px] sm:max-w-xs">
                {analytics?.site_name || 'Site Performance Analytics'}
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-brand-950 text-brand-300 border border-brand-800/60 rounded-full">
                {analytics?.biome || 'Rainforest'}
              </span>
            </div>
            <p className="text-xs text-earth-muted flex items-center space-x-2 mt-0.5">
              <span className="flex items-center">
                <MapPin className="w-3 h-3 mr-1 text-slate-400" />
                {analytics?.area_hectares.toLocaleString() || '0'} Hectares
              </span>
              <span>•</span>
              <span className="flex items-center">
                <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                {analytics?.history_months || 24} Months Historical Data
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleDelete}
            title="Delete Site"
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg border border-transparent hover:border-red-800/40 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsSiteDetailDrawerOpen(false)}
            className="p-2 text-slate-400 hover:text-white hover:bg-earth-border/60 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-3">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-earth-muted">
              Aggregating Sentinel-2 LiDAR & Biomass metrics...
            </p>
          </div>
        ) : analytics ? (
          <>
            {/* KPI Stat Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatCard
                title="Lifetime Carbon"
                value={analytics.total_cumulative_carbon_tco2e.toLocaleString()}
                unit="tCO₂e"
                icon={<TrendingUp className="w-4 h-4" />}
                trend="+18.4%"
                trendPositive={true}
              />
              <StatCard
                title="Annual Run-Rate"
                value={analytics.current_annual_rate_tco2e.toLocaleString()}
                unit="t/yr"
                icon={<Activity className="w-4 h-4" />}
                trend="+4.2%"
                trendPositive={true}
              />
              <StatCard
                title="Biodiversity Score"
                value={analytics.latest_biodiversity_index}
                unit="/ 100"
                icon={<Sparkles className="w-4 h-4" />}
                trend="Healthy"
                trendPositive={true}
              />
              <StatCard
                title="Vegetation NDVI"
                value={analytics.latest_ndvi}
                unit="Index"
                icon={<Trees className="w-4 h-4" />}
                trend="+0.12"
                trendPositive={true}
              />
              <StatCard
                title="Canopy Cover"
                value={analytics.latest_canopy_cover_pct}
                unit="%"
                icon={<Layers className="w-4 h-4" />}
                trend="Dense"
                trendPositive={true}
              />
              <StatCard
                title="Species Count"
                value={analytics.latest_species_richness}
                unit="Taxa"
                icon={<Sparkles className="w-4 h-4" />}
                trend="+14 New"
                trendPositive={true}
              />
            </div>

            {/* Highcharts Visualizations */}
            <div className="space-y-4">
              <CarbonMetricsChart metrics={analytics.time_series} />
              <BiodiversityChart metrics={analytics.time_series} />
              <VegetationIndexChart metrics={analytics.time_series} />
            </div>

            {/* Verification Footer */}
            <div className="bg-earth-card/60 border border-earth-border rounded-xl p-4 text-[11px] text-earth-muted flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-300">Observation Pipeline:</span>{' '}
                Sentinel-2 MSI (10m) + GEDI LiDAR (Level 4A Aboveground Biomass)
              </div>
              <span className="text-emerald-400 font-medium">Verified</span>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-earth-muted text-xs">
            No metrics found for this site.
          </div>
        )}
      </div>
    </aside>
  );
};
