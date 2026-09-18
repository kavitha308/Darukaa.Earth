import React from 'react';
import { Leaf, Plus, User as UserIcon, LogOut, Globe, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../context/authStore';
import { useMapStore } from '../../context/mapStore';
import { useProjects } from '../../hooks/useProjects';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { selectedProjectId, setSelectedProjectId, setIsCreateProjectModalOpen, setAuthModal } =
    useMapStore();

  const { data: projects = [] } = useProjects();

  return (
    <header className="h-16 bg-earth-dark/95 backdrop-blur border-b border-earth-border px-4 md:px-6 flex items-center justify-between z-30 relative select-none">
      {/* Brand & Tagline */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-800 via-brand-600 to-emerald-400 p-0.5 shadow-lg shadow-brand-900/30 flex items-center justify-center">
          <div className="w-full h-full bg-earth-dark rounded-[10px] flex items-center justify-center">
            <Leaf className="w-5 h-5 text-brand-400" />
          </div>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold tracking-tight text-white flex items-center">
              Darukaa<span className="text-brand-400">.Earth</span>
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold bg-brand-950 text-brand-300 border border-brand-800/60 rounded-full uppercase tracking-wider">
              PostGIS v3.3
            </span>
          </div>
          <p className="text-[11px] text-earth-muted hidden md:block">
            Geospatial Carbon & Biodiversity Analytics Platform
          </p>
        </div>
      </div>

      {/* Center: Project Selector */}
      <div className="flex items-center space-x-3">
        <div className="relative flex items-center">
          <Globe className="w-4 h-4 text-earth-muted absolute left-3 pointer-events-none" />
          <select
            aria-label="Filter by project"
            value={selectedProjectId || ''}
            onChange={(e) => setSelectedProjectId(e.target.value || null)}
            className="bg-earth-card border border-earth-border text-xs rounded-lg pl-9 pr-8 py-2 text-slate-200 focus:outline-none focus:border-brand-500 hover:border-earth-border/80 transition-colors appearance-none cursor-pointer"
          >
            <option value="">All Projects ({projects.length})</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.country})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setIsCreateProjectModalOpen(true)}
          className="flex items-center space-x-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition shadow-md shadow-brand-950"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Project</span>
        </button>
      </div>

      {/* Right: Auth Profile / Actions */}
      <div className="flex items-center space-x-3">
        <div className="hidden lg:flex items-center space-x-1.5 text-[11px] text-brand-400 bg-brand-950/80 px-2.5 py-1 rounded-full border border-brand-800/40">
          <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" />
          <span>Biomass Sentinel-2 Online</span>
        </div>

        {isAuthenticated && user ? (
          <div className="flex items-center space-x-2 pl-2 border-l border-earth-border">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium text-slate-200">{user.full_name}</p>
              <p className="text-[10px] text-brand-400 uppercase tracking-wider font-semibold">
                {user.role}
              </p>
            </div>
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-2 rounded-lg bg-earth-card hover:bg-red-950/40 border border-earth-border hover:border-red-800/50 text-slate-400 hover:text-red-400 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAuthModal(true, 'login')}
            className="flex items-center space-x-1.5 bg-earth-card hover:bg-earth-card/80 border border-earth-border hover:border-brand-600 text-slate-200 text-xs font-medium px-3 py-2 rounded-lg transition"
          >
            <UserIcon className="w-3.5 h-3.5 text-brand-400" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
