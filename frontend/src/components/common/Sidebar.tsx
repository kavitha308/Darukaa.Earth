import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Folder,
  MapPin,
  Trees,
  Layers,
  BarChart3,
  PenTool,
  Globe2,
} from 'lucide-react';
import { useMapStore } from '../../context/mapStore';
import { useProjects, useProject } from '../../hooks/useProjects';
import { useSites } from '../../hooks/useSites';
import { MOCK_PROJECTS, MOCK_SITE_FEATURES } from '../../services/mockData';

export const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const {
    selectedProjectId,
    setSelectedProjectId,
    selectedSiteId,
    setSelectedSiteId,
    startDrawing,
  } = useMapStore();

  const { data: projectList = [] } = useProjects();
  const { data: currentProject } = useProject(selectedProjectId);
  const { data: siteData } = useSites(selectedProjectId);

  // Prefer database records over mock data
  const activeProjects = projectList && projectList.length > 0 ? projectList : MOCK_PROJECTS;
  const activeSites =
    siteData?.features !== undefined
      ? siteData.features
      : selectedProjectId
        ? MOCK_SITE_FEATURES.features.filter((f) => f.properties.project_id === selectedProjectId)
        : MOCK_SITE_FEATURES.features;

  const currentSelectedProject =
    activeProjects.find((p) => p.id === selectedProjectId) ||
    (selectedProjectId ? currentProject : null);

  return (
    <aside
      aria-label="Project and Site Navigation"
      className={`relative z-20 h-full bg-earth-dark/95 border-r border-earth-border backdrop-blur-md transition-all duration-300 flex flex-col shrink-0 ${
        isCollapsed ? 'w-14' : 'w-80 sm:w-96'
      }`}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="absolute -right-3.5 top-6 z-30 w-7 h-7 rounded-full bg-earth-card border border-earth-border text-slate-300 hover:text-white flex items-center justify-center shadow-lg transition"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Collapsed view icon rail */}
      {isCollapsed ? (
        <div className="flex flex-col items-center py-6 space-y-6">
          <button
            onClick={() => {
              setIsCollapsed(false);
              setSelectedProjectId(null);
            }}
            title="All Projects"
            className="p-2.5 rounded-xl bg-earth-card hover:bg-earth-border text-brand-400 transition"
          >
            <Folder className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              setIsCollapsed(false);
              startDrawing();
            }}
            title="Draw Site"
            className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-md transition"
          >
            <PenTool className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Info Banner */}
          {currentSelectedProject ? (
            /* Selected Project View */
            <div className="p-4 border-b border-earth-border bg-earth-card/40">
              <button
                onClick={() => setSelectedProjectId(null)}
                className="flex items-center space-x-1.5 text-xs text-brand-400 hover:text-brand-300 font-medium mb-3 transition"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>All Projects Overview</span>
              </button>

              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-brand-950 text-brand-400 border border-brand-800/50 rounded-full">
                    {currentSelectedProject.project_type}
                  </span>
                  <h2 className="text-base font-bold text-white mt-1 leading-snug">
                    {currentSelectedProject.name}
                  </h2>
                  <p className="text-xs text-earth-muted flex items-center mt-1">
                    <Globe2 className="w-3 h-3 mr-1 text-slate-400" />
                    {currentSelectedProject.country}
                  </p>
                </div>
              </div>

              {/* Project Aggregate Summary Strip */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-earth-border/60">
                <div className="bg-earth-dark/60 p-2 rounded-lg border border-earth-border/50">
                  <span className="text-[10px] text-earth-muted uppercase tracking-wider block">
                    Total Area
                  </span>
                  <span className="text-sm font-bold text-white">
                    {currentSelectedProject.total_area_hectares?.toLocaleString() || '0'} ha
                  </span>
                </div>
                <div className="bg-earth-dark/60 p-2 rounded-lg border border-earth-border/50">
                  <span className="text-[10px] text-earth-muted uppercase tracking-wider block">
                    Total Sites
                  </span>
                  <span className="text-sm font-bold text-brand-400">
                    {activeSites.length} Polygons
                  </span>
                </div>
              </div>

              {/* Draw Action Button */}
              <button
                onClick={() => {
                  startDrawing();
                }}
                className="w-full mt-3 flex items-center justify-center space-x-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold py-2 px-3 rounded-lg shadow transition"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Draw New Site for this Project</span>
              </button>
            </div>
          ) : (
            /* All Projects View */
            <div className="p-4 border-b border-earth-border bg-earth-card/40">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Project Portfolio
                  </h2>
                  <p className="text-xs text-earth-muted mt-0.5">
                    {activeProjects.length} active carbon & biodiversity initiatives
                  </p>
                </div>
                <span className="p-1.5 rounded-lg bg-earth-dark text-brand-400 border border-earth-border">
                  <Layers className="w-4 h-4" />
                </span>
              </div>
            </div>
          )}

          {/* List Section: Sites or Projects */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {currentSelectedProject ? (
              /* Site List */
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Geographical Sites ({activeSites.length})
                  </h3>
                  <span className="text-[10px] text-earth-muted">Click to inspect</span>
                </div>

                {activeSites.length === 0 ? (
                  <div className="text-center py-8 px-4 bg-earth-card/40 border border-dashed border-earth-border rounded-xl">
                    <Trees className="w-8 h-8 text-earth-muted mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-medium text-slate-300">No sites added yet</p>
                    <p className="text-[11px] text-earth-muted mt-1">
                      Use the "Draw New Site Polygon" button on the map to delineate an area.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeSites.map((site) => {
                      const isSelected = selectedSiteId === site.id;
                      return (
                        <div
                          key={site.id}
                          onClick={() => setSelectedSiteId(site.id)}
                          className={`p-3 rounded-xl border transition cursor-pointer select-none ${
                            isSelected
                              ? 'bg-brand-950/80 border-brand-500 shadow-md shadow-brand-950'
                              : 'bg-earth-card/70 border-earth-border hover:border-brand-800/80 hover:bg-earth-card'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <h4 className="text-xs font-bold text-white group-hover:text-brand-300">
                              {site.properties.name}
                            </h4>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-earth-dark text-brand-400 border border-earth-border">
                              {site.properties.area_hectares} ha
                            </span>
                          </div>

                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-earth-border/40 text-[11px] text-earth-muted">
                            <span className="flex items-center">
                              <MapPin className="w-3 h-3 mr-1 text-slate-500" />
                              {site.properties.biome}
                            </span>
                            <span className="flex items-center text-brand-400 font-medium">
                              <BarChart3 className="w-3 h-3 mr-1" />
                              Analytics
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* Projects List */
              <div className="space-y-2.5">
                {activeProjects.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProjectId(p.id)}
                    className="p-3.5 rounded-xl bg-earth-card/70 border border-earth-border hover:border-brand-600 hover:bg-earth-card transition cursor-pointer group"
                  >
                    <div className="flex items-start justify-between">
                      <span className="px-2 py-0.5 text-[9px] font-semibold bg-earth-dark text-brand-300 border border-earth-border rounded-full">
                        {p.project_type}
                      </span>
                      <span className="text-xs text-earth-muted flex items-center">
                        <Globe2 className="w-3 h-3 mr-1" />
                        {p.country}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white mt-1.5 group-hover:text-brand-300 transition">
                      {p.name}
                    </h4>

                    {p.description && (
                      <p className="text-[11px] text-earth-muted line-clamp-2 mt-1">
                        {p.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-earth-border/40 text-[11px]">
                      <span className="text-slate-400">
                        {p.site_count || 0} Sites • {p.total_area_hectares || 0} ha
                      </span>
                      <span className="text-brand-400 font-medium group-hover:translate-x-0.5 transition flex items-center">
                        Explore Map →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
