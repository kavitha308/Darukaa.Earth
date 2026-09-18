import { create } from 'zustand';

interface MapState {
  selectedProjectId: string | null;
  selectedSiteId: string | null;
  activeBasemap: 'satellite' | 'dark' | 'outdoors';
  isDrawing: boolean;
  drawnCoordinates: number[][] | null;
  drawnAreaHectares: number | null;
  isSiteDetailDrawerOpen: boolean;
  isCreateSiteModalOpen: boolean;
  isCreateProjectModalOpen: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';

  setSelectedProjectId: (id: string | null) => void;
  setSelectedSiteId: (id: string | null) => void;
  setActiveBasemap: (style: 'satellite' | 'dark' | 'outdoors') => void;
  setIsDrawing: (drawing: boolean) => void;
  setDrawnPolygon: (coords: number[][] | null, areaHa: number | null) => void;
  clearDrawnPolygon: () => void;
  setIsSiteDetailDrawerOpen: (open: boolean) => void;
  setIsCreateSiteModalOpen: (open: boolean) => void;
  setIsCreateProjectModalOpen: (open: boolean) => void;
  setAuthModal: (open: boolean, mode?: 'login' | 'register') => void;
}

export const useMapStore = create<MapState>((set) => ({
  selectedProjectId: null,
  selectedSiteId: null,
  activeBasemap: 'satellite',
  isDrawing: false,
  drawnCoordinates: null,
  drawnAreaHectares: null,
  isSiteDetailDrawerOpen: false,
  isCreateSiteModalOpen: false,
  isCreateProjectModalOpen: false,
  isAuthModalOpen: false,
  authModalMode: 'login',

  setSelectedProjectId: (id) => set({ selectedProjectId: id }),
  setSelectedSiteId: (id) =>
    set({
      selectedSiteId: id,
      isSiteDetailDrawerOpen: !!id,
    }),
  setActiveBasemap: (basemap) => set({ activeBasemap: basemap }),
  setIsDrawing: (drawing) => set({ isDrawing: drawing }),
  setDrawnPolygon: (coords, areaHa) =>
    set({
      drawnCoordinates: coords,
      drawnAreaHectares: areaHa,
      isCreateSiteModalOpen: !!coords,
    }),
  clearDrawnPolygon: () =>
    set({
      drawnCoordinates: null,
      drawnAreaHectares: null,
      isCreateSiteModalOpen: false,
      isDrawing: false,
    }),
  setIsSiteDetailDrawerOpen: (open) =>
    set((state) => ({
      isSiteDetailDrawerOpen: open,
      selectedSiteId: open ? state.selectedSiteId : null,
    })),
  setIsCreateSiteModalOpen: (open) => set({ isCreateSiteModalOpen: open }),
  setIsCreateProjectModalOpen: (open) => set({ isCreateProjectModalOpen: open }),
  setAuthModal: (open, mode = 'login') =>
    set({
      isAuthModalOpen: open,
      authModalMode: mode,
    }),
}));
