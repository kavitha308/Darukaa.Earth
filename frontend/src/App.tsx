import React, { useEffect } from 'react';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { MapView } from './components/map/MapView';
import { SiteDetailDrawer } from './components/sites/SiteDetailDrawer';
import { SiteCreateModal } from './components/sites/SiteCreateModal';
import { ProjectModal } from './components/projects/ProjectModal';
import { AuthModal } from './components/auth/AuthModal';
import { useAuthStore } from './context/authStore';

export const App: React.FC = () => {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-earth-dark text-slate-100 select-none">
      {/* Top Navigation */}
      <Navbar />

      {/* Main Workspace Layout */}
      <main className="flex-1 relative overflow-hidden flex">
        {/* Left Navigation Sidebar */}
        <Sidebar />

        {/* Mapbox GL JS Vector Canvas */}
        <section aria-label="Geospatial Map Workspace" className="flex-1 h-full w-full relative">
          <MapView />
        </section>

        {/* Slide-out Analytics Drawer */}
        <SiteDetailDrawer />
      </main>

      {/* Modals */}
      <SiteCreateModal />
      <ProjectModal />
      <AuthModal />
    </div>
  );
};

export default App;
