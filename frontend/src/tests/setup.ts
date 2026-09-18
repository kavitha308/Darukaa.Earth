import '@testing-library/jest-dom';
import React from 'react';
import { vi } from 'vitest';

// Mock Mapbox GL JS for JSDOM test environment
vi.mock('mapbox-gl', () => {
  return {
    default: {
      Map: vi.fn(() => ({
        on: vi.fn(),
        remove: vi.fn(),
        addControl: vi.fn(),
        getSource: vi.fn(),
        addSource: vi.fn(),
        addLayer: vi.fn(),
        setStyle: vi.fn(),
        flyTo: vi.fn(),
        zoomIn: vi.fn(),
        zoomOut: vi.fn(),
        getCanvas: vi.fn(() => ({ style: {} })),
        isStyleLoaded: vi.fn(() => true),
        once: vi.fn(),
      })),
      Popup: vi.fn(() => ({
        setLngLat: vi.fn().mockReturnThis(),
        setHTML: vi.fn().mockReturnThis(),
        addTo: vi.fn().mockReturnThis(),
        remove: vi.fn().mockReturnThis(),
      })),
      accessToken: '',
    },
  };
});

// Mock MapboxDraw
vi.mock('@mapbox/mapbox-gl-draw', () => {
  return {
    default: vi.fn(() => ({
      changeMode: vi.fn(),
      deleteAll: vi.fn(),
      getAll: vi.fn(() => ({ features: [] })),
    })),
  };
});

// Mock HighchartsReact using React.createElement (pure TS compatible)
vi.mock('highcharts-react-official', () => {
  return {
    default: () =>
      React.createElement('div', { 'data-testid': 'highcharts-mock' }, 'Highcharts Visualization'),
  };
});
