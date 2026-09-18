import React, { useState } from 'react';
import { Check, MapPin } from 'lucide-react';
import { useMapStore } from '../../context/mapStore';
import { useProjects } from '../../hooks/useProjects';
import { useCreateSite } from '../../hooks/useSites';
import { Modal } from '../common/Modal';

const BIOMES = [
  'Tropical Rainforest',
  'Mangrove Wetland',
  'Temperate Peatland',
  'Savanna & Agroforestry',
  'Boreal Forest',
];

export const SiteCreateModal: React.FC = () => {
  const {
    selectedProjectId,
    drawnCoordinates,
    drawnAreaHectares,
    isCreateSiteModalOpen,
    clearDrawnPolygon,
  } = useMapStore();

  const { data: projects = [] } = useProjects();
  const createSiteMutation = useCreateSite();

  const [projectId, setProjectId] = useState<string>(selectedProjectId || (projects[0]?.id ?? ''));
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [biome, setBiome] = useState('Tropical Rainforest');
  const [error, setError] = useState<string | null>(null);

  // Sync default project
  React.useEffect(() => {
    if (selectedProjectId) {
      setProjectId(selectedProjectId);
    } else if (projects.length > 0 && !projectId) {
      setProjectId(projects[0].id);
    }
  }, [selectedProjectId, projects, projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide a name for this site.');
      return;
    }

    if (!projectId) {
      setError('Please select a parent project.');
      return;
    }

    if (!drawnCoordinates) {
      setError('No polygon coordinates captured.');
      return;
    }

    try {
      await createSiteMutation.mutateAsync({
        project_id: projectId,
        name: name.trim(),
        description: description.trim() || undefined,
        biome,
        geometry: {
          type: 'Polygon',
          coordinates: drawnCoordinates as any,
        },
      });

      clearDrawnPolygon();
      setName('');
      setDescription('');
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to create site.');
    }
  };

  return (
    <Modal
      isOpen={isCreateSiteModalOpen}
      onClose={clearDrawnPolygon}
      title="Register New Geographical Site"
      subtitle="Confirm polygon geometry and configure ecological parameters"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 text-xs rounded-lg">
            {error}
          </div>
        )}

        {/* Spatial Measurement Badge */}
        <div className="bg-earth-dark p-3 rounded-xl border border-brand-800/40 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-brand-300">
            <MapPin className="w-4 h-4 text-brand-400" />
            <span>Calculated Geodetic Surface Area:</span>
          </div>
          <span className="text-sm font-bold text-white bg-brand-950 px-2.5 py-1 rounded-lg border border-brand-800/60">
            {drawnAreaHectares?.toLocaleString() || '0'} Hectares
          </span>
        </div>

        {/* Parent Project */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Parent Project <span className="text-red-400">*</span>
          </label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full bg-earth-dark border border-earth-border rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            required
          >
            <option value="" disabled>
              Select parent project...
            </option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.country})
              </option>
            ))}
          </select>
        </div>

        {/* Site Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Site Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Mangrove Mudflat Sector 4"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-earth-dark border border-earth-border rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            required
          />
        </div>

        {/* Biome */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Ecological Biome
          </label>
          <select
            value={biome}
            onChange={(e) => setBiome(e.target.value)}
            className="w-full bg-earth-dark border border-earth-border rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
          >
            {BIOMES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
          <textarea
            rows={2}
            placeholder="Key reforestation species, soil type, and conservation objectives..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-earth-dark border border-earth-border rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={clearDrawnPolygon}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-earth-border/40 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createSiteMutation.isPending}
            className="flex items-center space-x-1.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-md shadow-brand-950 transition"
          >
            <Check className="w-4 h-4" />
            <span>
              {createSiteMutation.isPending
                ? 'Saving Site & Seeding Metrics...'
                : 'Save Site & Generate Metrics'}
            </span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
