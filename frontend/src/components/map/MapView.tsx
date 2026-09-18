import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import {
  Compass,
  ZoomIn,
  ZoomOut,
  PenTool,
  Check,
  RotateCcw,
  AlertTriangle,
  Save,
  Trash2,
  Edit3,
} from 'lucide-react';
import { useMapStore } from '../../context/mapStore';
import { useSites } from '../../hooks/useSites';
import { MOCK_SITE_FEATURES } from '../../services/mockData';
import { SiteFeature } from '../../types';

// Area calculation using spherical excess (Gauss-Bonnet) for geodetic accuracy
function computeClientHectares(coords: number[][]): number {
  if (!coords || coords.length < 4) return 0;
  let total = 0;
  const radius = 6371008.8; // Earth authalic mean radius in meters
  for (let i = 0; i < coords.length - 1; i++) {
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const lon1 = (p1[0] * Math.PI) / 180;
    const lat1 = (p1[1] * Math.PI) / 180;
    const lon2 = (p2[0] * Math.PI) / 180;
    const lat2 = (p2[1] * Math.PI) / 180;
    total += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  const sqMeters = Math.abs((total * radius * radius) / 2);
  return Math.round((sqMeters / 10000) * 100) / 100;
}

const BASEMAP_STYLES = {
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  dark: 'mapbox://styles/mapbox/dark-v11',
  outdoors: 'mapbox://styles/mapbox/outdoors-v12',
};

const OSM_FALLBACK_STYLE: mapboxgl.Style = {
  version: 8,
  sources: {
    'carto-dark': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '© CartoDB, © OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'carto-dark-tiles',
      type: 'raster',
      source: 'carto-dark',
      minzoom: 0,
      maxzoom: 22,
    },
  ],
};

// Complete MapboxDraw stylesheet supporting LineString and Polygon drawing states
const MAPBOX_DRAW_THEME = [
  // 1. Polygon Fill
  {
    id: 'gl-draw-polygon-fill',
    type: 'fill',
    filter: ['all', ['==', '$type', 'Polygon']],
    paint: {
      'fill-color': ['case', ['==', ['get', 'active'], 'true'], '#4ade80', '#22c55e'],
      'fill-opacity': 0.35,
    },
  },
  // 2. Lines: matches LineStrings AND in-progress Polygon boundary lines
  {
    id: 'gl-draw-lines',
    type: 'line',
    filter: ['any', ['==', '$type', 'LineString'], ['==', '$type', 'Polygon']],
    layout: {
      'line-cap': 'round',
      'line-join': 'round',
    },
    paint: {
      'line-color': ['case', ['==', ['get', 'active'], 'true'], '#4ade80', '#22c55e'],
      'line-width': 3,
    },
  },
  // 3. Points (Feature outer halo)
  {
    id: 'gl-draw-point-outer',
    type: 'circle',
    filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'feature']],
    paint: {
      'circle-radius': 8,
      'circle-color': '#ffffff',
    },
  },
  // 4. Points (Feature inner fill)
  {
    id: 'gl-draw-point-inner',
    type: 'circle',
    filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'feature']],
    paint: {
      'circle-radius': 6,
      'circle-color': '#16a34a',
    },
  },
  // 5. Vertices during drawing and direct_select (outer halo)
  {
    id: 'gl-draw-vertex-outer',
    type: 'circle',
    filter: [
      'all',
      ['==', '$type', 'Point'],
      ['==', 'meta', 'vertex'],
      ['!=', 'mode', 'simple_select'],
    ],
    paint: {
      'circle-radius': 8,
      'circle-color': '#ffffff',
    },
  },
  // 6. Vertices during drawing and direct_select (inner circle)
  {
    id: 'gl-draw-vertex-inner',
    type: 'circle',
    filter: [
      'all',
      ['==', '$type', 'Point'],
      ['==', 'meta', 'vertex'],
      ['!=', 'mode', 'simple_select'],
    ],
    paint: {
      'circle-radius': 6,
      'circle-color': ['case', ['==', ['get', 'active'], 'true'], '#4ade80', '#16a34a'],
    },
  },
  // 7. Midpoints for dragging new vertices
  {
    id: 'gl-draw-midpoint',
    type: 'circle',
    filter: ['all', ['==', 'meta', 'midpoint']],
    paint: {
      'circle-radius': 5,
      'circle-color': '#fde047',
    },
  },
];

export const MapView: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  const {
    selectedProjectId,
    selectedSiteId,
    setSelectedSiteId,
    activeBasemap,
    setActiveBasemap,
    isDrawing,
    setIsDrawing,
    drawTrigger,
    startDrawing,
    drawnCoordinates,
    drawnAreaHectares,
    setDrawnPolygon,
    clearDrawnPolygon,
    setIsCreateSiteModalOpen,
  } = useMapStore();

  const { data: siteData } = useSites(selectedProjectId);
  const [tokenMissing, setTokenMissing] = useState(false);
  const [currentFeatureId, setCurrentFeatureId] = useState<string | null>(null);

  // Synchronize state into refs for access in event listeners
  const isDrawingRef = useRef(isDrawing);
  isDrawingRef.current = isDrawing;

  // Prefer database records if query has settled; fall back to mock data if empty
  const activeFeatures =
    siteData?.features !== undefined ? siteData.features : MOCK_SITE_FEATURES.features;
  const activeFeaturesRef = useRef(activeFeatures);
  activeFeaturesRef.current = activeFeatures;

  // Render or update site vector layers
  const renderSiteLayers = useCallback(
    (map: mapboxgl.Map, features: SiteFeature[]) => {
      const geojsonData: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: features as any,
      };

      const source = map.getSource('darukaa-sites') as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData(geojsonData);
      } else {
        map.addSource('darukaa-sites', {
          type: 'geojson',
          data: geojsonData,
        });

        // Fill layer
        map.addLayer({
          id: 'sites-fill',
          type: 'fill',
          source: 'darukaa-sites',
          paint: {
            'fill-color': [
              'case',
              ['==', ['get', 'biome'], 'Mangrove Wetland'],
              '#06b6d4',
              ['==', ['get', 'biome'], 'Temperate Peatland'],
              '#eab308',
              '#22c55e', // Tropical Rainforest default
            ],
            'fill-opacity': 0.35,
          },
        });

        // Stroke layer
        map.addLayer({
          id: 'sites-stroke',
          type: 'line',
          source: 'darukaa-sites',
          paint: {
            'line-color': [
              'case',
              ['==', ['get', 'biome'], 'Mangrove Wetland'],
              '#22d3ee',
              ['==', ['get', 'biome'], 'Temperate Peatland'],
              '#fde047',
              '#4ade80',
            ],
            'line-width': 2.5,
            'line-opacity': 0.9,
          },
        });

        // Hover popup handler
        map.on('mouseenter', 'sites-fill', (e) => {
          if (isDrawingRef.current) return;
          map.getCanvas().style.cursor = 'pointer';
          if (e.features && e.features[0]) {
            const props = e.features[0].properties;
            const coords = e.lngLat;
            if (popupRef.current && props) {
              popupRef.current
                .setLngLat(coords)
                .setHTML(
                  `<div style="background:#121F17;color:#fff;padding:8px 12px;border-radius:8px;border:1px solid #1E3326;font-family:sans-serif;">
                  <strong style="font-size:12px;color:#4ade80;">${props.name}</strong>
                  <div style="font-size:10px;color:#94a3b8;margin-top:2px;">Biome: ${props.biome || 'N/A'}</div>
                  <div style="font-size:10px;color:#94a3b8;">Area: ${props.area_hectares || '0'} ha</div>
                </div>`
                )
                .addTo(map);
            }
          }
        });

        map.on('mouseleave', 'sites-fill', () => {
          map.getCanvas().style.cursor = '';
          if (popupRef.current) popupRef.current.remove();
        });

        // Click handler: do not trigger if user is actively drawing
        map.on('click', 'sites-fill', (e) => {
          if (isDrawingRef.current) return;
          if (e.features && e.features[0]) {
            const props = e.features[0].properties;
            if (props?.id) {
              setSelectedSiteId(props.id);
              if (props.centroid_lng && props.centroid_lat) {
                map.flyTo({
                  center: [Number(props.centroid_lng), Number(props.centroid_lat)],
                  zoom: 12,
                  duration: 1200,
                });
              }
            }
          }
        });
      }
    },
    [setSelectedSiteId]
  );

  // Initialize Mapbox map strictly ONCE on mount
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const token = import.meta.env.VITE_MAPBOX_TOKEN?.trim();
    if (!token) {
      setTokenMissing(true);
    } else {
      mapboxgl.accessToken = token;
    }

    const initialStyle = token ? BASEMAP_STYLES.satellite : (OSM_FALLBACK_STYLE as any);

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: initialStyle,
      center: [20, 15],
      zoom: 2.2,
      attributionControl: true,
    });

    mapRef.current = map;

    // Initialize Mapbox Draw with complete stylesheet supporting LineString and Polygon
    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {},
      defaultMode: 'simple_select',
      styles: MAPBOX_DRAW_THEME,
    });

    drawRef.current = draw;
    map.addControl(draw as any);

    popupRef.current = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      className: 'darukaa-popup',
    });

    // Handle Draw Events
    const handleDrawCreate = (e: any) => {
      const feature = e.features?.[0];
      if (feature && feature.geometry.type === 'Polygon') {
        const ring = feature.geometry.coordinates[0];
        const areaHa = computeClientHectares(ring);
        setCurrentFeatureId(feature.id);
        setDrawnPolygon(feature.geometry.coordinates, areaHa);
        setIsDrawing(false);
      }
    };

    const handleDrawUpdate = (e: any) => {
      const feature = e.features?.[0];
      if (feature && feature.geometry.type === 'Polygon') {
        const ring = feature.geometry.coordinates[0];
        const areaHa = computeClientHectares(ring);
        setCurrentFeatureId(feature.id);
        setDrawnPolygon(feature.geometry.coordinates, areaHa);
      }
    };

    const handleDrawDelete = () => {
      setCurrentFeatureId(null);
      clearDrawnPolygon();
      setIsDrawing(false);
    };

    map.on('draw.create', handleDrawCreate);
    map.on('draw.update', handleDrawUpdate);
    map.on('draw.delete', handleDrawDelete);

    map.on('load', () => {
      renderSiteLayers(map, activeFeaturesRef.current);
      map.resize();
    });

    return () => {
      map.remove();
      mapRef.current = null;
      drawRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      mapRef.current?.resize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update Basemap Style dynamically without destroying map instance
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const token = import.meta.env.VITE_MAPBOX_TOKEN?.trim();
    if (!token) return;

    map.setStyle(BASEMAP_STYLES[activeBasemap]);
    map.once('style.load', () => {
      renderSiteLayers(map, activeFeaturesRef.current);
    });
  }, [activeBasemap, renderSiteLayers]);

  // Update GeoJSON source when features change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    renderSiteLayers(map, activeFeatures);
  }, [activeFeatures, renderSiteLayers]);

  // Synchronize draw tool mode whenever startDrawing is called or drawTrigger changes
  useEffect(() => {
    const draw = drawRef.current;
    if (!draw) return;

    if (isDrawing) {
      draw.deleteAll();
      draw.changeMode('draw_polygon');
    }
  }, [isDrawing, drawTrigger]);

  // If drawn polygon was cleared (e.g. from modal cancel or saved), clear Draw layer
  useEffect(() => {
    if (!drawnCoordinates && drawRef.current) {
      const features = drawRef.current.getAll().features;
      if (features.length > 0) {
        drawRef.current.deleteAll();
        drawRef.current.changeMode('simple_select');
      }
      setCurrentFeatureId(null);
    }
  }, [drawnCoordinates]);

  // Cancel Drawing action
  const handleCancelDraw = () => {
    if (drawRef.current) {
      drawRef.current.deleteAll();
      drawRef.current.changeMode('simple_select');
    }
    clearDrawnPolygon();
    setCurrentFeatureId(null);
    setIsDrawing(false);
  };

  // Edit vertices action
  const handleEditVertices = () => {
    if (!drawRef.current || !currentFeatureId) return;
    drawRef.current.changeMode('direct_select', { featureId: currentFeatureId });
  };

  // Fly to site when selectedSiteId changes
  useEffect(() => {
    if (!selectedSiteId || !mapRef.current) return;
    const targetSite = activeFeatures.find((f) => f.id === selectedSiteId);
    if (targetSite?.properties?.centroid_lng && targetSite?.properties?.centroid_lat) {
      mapRef.current.flyTo({
        center: [targetSite.properties.centroid_lng, targetSite.properties.centroid_lat],
        zoom: 12,
        duration: 1400,
      });
    }
  }, [selectedSiteId, activeFeatures]);

  return (
    <div className="relative w-full h-full">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full bg-earth-dark" />

      {/* Floating Notice if Mapbox token is absent */}
      {tokenMissing && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-earth-card/90 border border-amber-500/40 text-amber-200 text-xs px-4 py-2 rounded-xl backdrop-blur shadow-lg flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Using open Carto basemap fallback. Set <code>VITE_MAPBOX_TOKEN</code> in{' '}
            <code>.env</code> for official Mapbox satellite styles.
          </span>
        </div>
      )}

      {/* Interactive GIS Drawing Action Toolbar */}
      <div className="absolute top-4 left-4 z-20 flex items-center space-x-2 bg-earth-card/95 border border-earth-border p-2 rounded-xl shadow-2xl backdrop-blur-md">
        {!isDrawing && !drawnCoordinates && (
          <button
            onClick={startDrawing}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-950 transition hover:scale-[1.02] active:scale-[0.98]"
          >
            <PenTool className="w-4 h-4" />
            <span>Draw New Site Polygon</span>
          </button>
        )}

        {isDrawing && (
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-300 bg-emerald-950/80 px-3 py-1.5 rounded-lg border border-emerald-700/60 shadow animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span>
                Click on the map to add boundary points. Click first point to close polygon.
              </span>
            </div>

            <button
              onClick={handleCancelDraw}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-earth-dark hover:bg-red-950/60 border border-earth-border hover:border-red-700 text-slate-300 hover:text-red-300 text-xs font-semibold transition"
              title="Cancel drawing session"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          </div>
        )}

        {!isDrawing && drawnCoordinates && (
          <div className="flex items-center space-x-2.5">
            {/* Area Calculated Badge */}
            <div className="flex items-center space-x-2 bg-brand-950/90 border border-brand-700/70 px-3.5 py-1.5 rounded-lg text-xs text-brand-300 font-bold">
              <Check className="w-4 h-4 text-brand-400" />
              <span>Polygon Area: {drawnAreaHectares?.toLocaleString() || '0'} ha</span>
            </div>

            {/* Edit Vertices Button */}
            <button
              onClick={handleEditVertices}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-earth-dark hover:bg-earth-border border border-earth-border text-slate-300 hover:text-white text-xs font-medium transition"
              title="Click and drag polygon vertices"
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-400" />
              <span>Edit Vertices</span>
            </button>

            {/* Redraw / Discard */}
            <button
              onClick={handleCancelDraw}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-earth-dark hover:bg-red-950/60 border border-earth-border hover:border-red-700 text-slate-300 hover:text-red-300 text-xs font-medium transition"
              title="Discard and redraw"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Discard</span>
            </button>

            {/* Primary Save Site CTA */}
            <button
              onClick={() => setIsCreateSiteModalOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-950 transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <Save className="w-4 h-4" />
              <span>Save Site Details →</span>
            </button>
          </div>
        )}
      </div>

      {/* Basemap & Navigation Controls */}
      <div className="absolute bottom-6 right-6 z-20 flex flex-col space-y-2">
        {/* Basemap Switcher */}
        <div className="bg-earth-card/95 border border-earth-border rounded-xl p-1.5 shadow-xl backdrop-blur flex flex-col space-y-1">
          <button
            onClick={() => setActiveBasemap('satellite')}
            className={`px-3 py-1.5 text-[11px] font-medium rounded-lg text-left transition flex items-center justify-between ${
              activeBasemap === 'satellite'
                ? 'bg-brand-600 text-white'
                : 'text-slate-300 hover:bg-earth-border/60'
            }`}
          >
            <span>Satellite</span>
            {activeBasemap === 'satellite' && <Check className="w-3 h-3 ml-2" />}
          </button>
          <button
            onClick={() => setActiveBasemap('dark')}
            className={`px-3 py-1.5 text-[11px] font-medium rounded-lg text-left transition flex items-center justify-between ${
              activeBasemap === 'dark'
                ? 'bg-brand-600 text-white'
                : 'text-slate-300 hover:bg-earth-border/60'
            }`}
          >
            <span>Dark Night</span>
            {activeBasemap === 'dark' && <Check className="w-3 h-3 ml-2" />}
          </button>
          <button
            onClick={() => setActiveBasemap('outdoors')}
            className={`px-3 py-1.5 text-[11px] font-medium rounded-lg text-left transition flex items-center justify-between ${
              activeBasemap === 'outdoors'
                ? 'bg-brand-600 text-white'
                : 'text-slate-300 hover:bg-earth-border/60'
            }`}
          >
            <span>Terrain</span>
            {activeBasemap === 'outdoors' && <Check className="w-3 h-3 ml-2" />}
          </button>
        </div>

        {/* Zoom In / Out / Reset */}
        <div className="bg-earth-card/95 border border-earth-border rounded-xl p-1 shadow-xl backdrop-blur flex flex-col space-y-1">
          <button
            onClick={() => mapRef.current?.zoomIn()}
            className="p-2 text-slate-300 hover:text-white hover:bg-earth-border/60 rounded-lg transition"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => mapRef.current?.zoomOut()}
            className="p-2 text-slate-300 hover:text-white hover:bg-earth-border/60 rounded-lg transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              mapRef.current?.flyTo({ center: [20, 15], zoom: 2.2 });
            }}
            className="p-2 text-slate-300 hover:text-white hover:bg-earth-border/60 rounded-lg transition"
            title="Reset Global View"
          >
            <Compass className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
