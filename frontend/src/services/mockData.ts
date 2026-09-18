import { Project, SiteFeatureCollection } from '../types';

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj-sundarbans',
    name: 'Sundarbans Mangrove Blue Carbon Reserve',
    description:
      'Coastal tidal wetland restoration for maximum blue carbon capture and tiger habitat protection.',
    project_type: 'Mangrove Restoration',
    country: 'Bangladesh',
    status: 'active',
    owner_id: 'admin-1',
    site_count: 2,
    total_area_hectares: 1240.5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'proj-amazon',
    name: 'Amazonian Bio-Corridor Initiative',
    description:
      'Connecting fragmented primary rainforest patches in the Xingu river basin to rebuild biological corridors.',
    project_type: 'Reforestation',
    country: 'Brazil',
    status: 'active',
    owner_id: 'admin-1',
    site_count: 2,
    total_area_hectares: 3480.2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'proj-cairngorms',
    name: 'Cairngorms Caledonian Forest Rewilding',
    description:
      'Large-scale regeneration of Scotland native Scots Pine and peatland carbon protection.',
    project_type: 'Peatland Conservation',
    country: 'United Kingdom',
    status: 'active',
    owner_id: 'admin-1',
    site_count: 1,
    total_area_hectares: 850.0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const MOCK_SITE_FEATURES: SiteFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'site-karamjal',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [89.585, 22.42],
            [89.61, 22.425],
            [89.625, 22.405],
            [89.595, 22.395],
            [89.585, 22.42],
          ],
        ],
      },
      properties: {
        id: 'site-karamjal',
        project_id: 'proj-sundarbans',
        name: 'Karamjal Tidal Estuary Zone',
        description:
          'High-density Rhizophora mangrove afforestation on active intertidal mudflats.',
        area_hectares: 680.5,
        centroid_lat: 22.4112,
        centroid_lng: 89.6037,
        bbox: [89.585, 22.395, 89.625, 22.425],
        biome: 'Mangrove Wetland',
      },
    },
    {
      type: 'Feature',
      id: 'site-kotka',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [89.72, 21.87],
            [89.75, 21.885],
            [89.765, 21.86],
            [89.735, 21.845],
            [89.72, 21.87],
          ],
        ],
      },
      properties: {
        id: 'site-kotka',
        project_id: 'proj-sundarbans',
        name: 'Kotka Wildlife Sanctuary Buffer',
        description: 'Canopy enrichment and salinity regulation corridor.',
        area_hectares: 560.0,
        centroid_lat: 21.865,
        centroid_lng: 89.7425,
        bbox: [89.72, 21.845, 89.765, 21.885],
        biome: 'Mangrove Wetland',
      },
    },
    {
      type: 'Feature',
      id: 'site-xingu-a',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-52.35, -3.22],
            [-52.31, -3.21],
            [-52.29, -3.245],
            [-52.34, -3.26],
            [-52.35, -3.22],
          ],
        ],
      },
      properties: {
        id: 'site-xingu-a',
        project_id: 'proj-amazon',
        name: 'Xingu Headwaters Bio-Corridor A',
        description: 'Native hardwood canopy restoration connecting forest fragments.',
        area_hectares: 1820.2,
        centroid_lat: -3.2338,
        centroid_lng: -52.3225,
        bbox: [-52.35, -3.26, -52.29, -3.21],
        biome: 'Tropical Rainforest',
      },
    },
    {
      type: 'Feature',
      id: 'site-glen-feshie',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-3.91, 57.06],
            [-3.87, 57.075],
            [-3.85, 57.05],
            [-3.895, 57.035],
            [-3.91, 57.06],
          ],
        ],
      },
      properties: {
        id: 'site-glen-feshie',
        project_id: 'proj-cairngorms',
        name: 'Glen Feshie Regeneration Plot',
        description: 'Highland deer exclosure zone allowing natural pine and birch regeneration.',
        area_hectares: 850.0,
        centroid_lat: 57.055,
        centroid_lng: -3.8812,
        bbox: [-3.91, 57.035, -3.85, 57.075],
        biome: 'Temperate Peatland',
      },
    },
  ],
};
