import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { Compass, ZoomIn, ZoomOut, PenTool, Check, RotateCcw, AlertTriangle } from 'lucide-react';
import { useMapStore } from '../../context/mapStore';
import { useSites } from '../../hooks/useSites';
import { MOCK_SITE_FEATURES } from '../../services/mockData';
import { SiteFeature } from '../../types';

// Area calculation on client side for immediate feedback during drawing
function computeClientHectares(coords: number[][]): number {
  if (coords.length < 4) return 0;
  let total = 0;
  const radius = 6371008.8;
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

// OpenStreetMap fallback style if no Mapbox token is supplied
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
    setDrawnPolygon,
    clearDrawnPolygon,
  } = useMapStore();

  const { data: siteData } = useSites(selectedProjectId);
  const [tokenMissing, setTokenMissing] = useState(false);

  // Fallback to mock data if API is loading or empty
  const activeFeatures = siteData?.features?.length
    ? siteData.features
    : MOCK_SITE_FEATURES.features;
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
              '#22c55e', // Tropical Rainforest
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

        // Hover and Click Handlers
        map.on('mouseenter', 'sites-fill', (e) => {
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

        map.on('click', 'sites-fill', (e) => {
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

  // Initialize Mapbox map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const token = import.meta.env.VITE_MAPBOX_TOKEN?.trim();
    if (!token) {
      setTokenMissing(true);
    } else {
      mapboxgl.accessToken = token;
    }

    const mapStyle = token ? BASEMAP_STYLES[activeBasemap] : (OSM_FALLBACK_STYLE as any);

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [20, 15],
      zoom: 2.2,
      attributionControl: true,
    });

    mapRef.current = map;

    // Initialize Mapbox Draw plugin
    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true,
      },
      defaultMode: 'simple_select',
      styles: [
        {
          id: 'gl-draw-polygon-fill',
          type: 'fill',
          filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
          paint: {
            'fill-color': '#22c55e',
            'fill-outline-color': '#4ade80',
            'fill-opacity': 0.35,
          },
        },
        {
          id: 'gl-draw-polygon-stroke',
          type: 'line',
          filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
          },
          paint: {
            'line-color': '#4ade80',
            'line-width': 2.5,
          },
        },
        {
          id: 'gl-draw-point-stroke',
          type: 'circle',
          filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'vertex']],
          paint: {
            'circle-radius': 5,
            'circle-color': '#ffffff',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#16a34a',
          },
        },
      ],
    });

    drawRef.current = draw;
    map.addControl(draw as any, 'top-left');

    // Create Popup
    popupRef.current = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      className: 'darukaa-popup',
    });

    // Handle Draw Events
    const handleDrawCreate = (e: any) => {
      const feature = e.features[0];
      if (feature && feature.geometry.type === 'Polygon') {
        const ring = feature.geometry.coordinates[0];
        const areaHa = computeClientHectares(ring);
        setDrawnPolygon(feature.geometry.coordinates, areaHa);
        setIsDrawing(false);
      }
    };

    map.on('draw.create', handleDrawCreate);

    map.on('load', () => {
      renderSiteLayers(map, activeFeaturesRef.current);
    });

    return () => {
      map.remove();
    };
  }, [activeBasemap, renderSiteLayers, setDrawnPolygon, setIsDrawing]);

  // Update Basemap Style
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const token = import.meta.env.VITE_MAPBOX_TOKEN?.trim();
    if (!token) return;

    map.setStyle(BASEMAP_STYLES[activeBasemap]);
    map.once('style.load', () => {
      renderSiteLayers(map, activeFeatures);
    });
  }, [activeBasemap, activeFeatures, renderSiteLayers]);

  // Update GeoJSON source when features change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    renderSiteLayers(map, activeFeatures);
  }, [activeFeatures, renderSiteLayers]);

  // Handle Draw Toggle
  const toggleDrawMode = () => {
    if (!drawRef.current) return;
    if (isDrawing) {
      drawRef.current.changeMode('simple_select');
      setIsDrawing(false);
      clearDrawnPolygon();
    } else {
      drawRef.current.deleteAll();
      drawRef.current.changeMode('draw_polygon');
      setIsDrawing(true);
    }
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

      {/* Drawing Toolbar Overlay */}
      <div className="absolute top-4 left-4 z-20 flex items-center space-x-2 bg-earth-card/95 border border-earth-border p-1.5 rounded-xl shadow-xl backdrop-blur">
        <button
          onClick={toggleDrawMode}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
            isDrawing
              ? 'bg-amber-600 text-white animate-pulse'
              : 'bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-950'
          }`}
        >
          <PenTool className="w-3.5 h-3.5" />
          <span>{isDrawing ? 'Click to finish polygon' : 'Draw New Site Polygon'}</span>
        </button>

        {isDrawing && (
          <button
            onClick={() => {
              if (drawRef.current) {
                drawRef.current.deleteAll();
                drawRef.current.changeMode('simple_select');
              }
              setIsDrawing(false);
              clearDrawnPolygon();
            }}
            className="p-2 rounded-lg bg-earth-dark hover:bg-earth-border text-slate-400 hover:text-white transition"
            title="Cancel Draw"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
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
