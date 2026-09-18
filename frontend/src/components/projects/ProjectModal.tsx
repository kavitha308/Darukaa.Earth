import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { useMapStore } from '../../context/mapStore';
import { useCreateProject } from '../../hooks/useProjects';
import { Modal } from '../common/Modal';

const PROJECT_TYPES = [
  'Reforestation',
  'Mangrove Restoration',
  'Peatland Conservation',
  'Agroforestry & Soil Carbon',
  'Afforestation',
  'Grassland Rewilding',
];

export const ProjectModal: React.FC = () => {
  const { isCreateProjectModalOpen, setIsCreateProjectModalOpen, setSelectedProjectId } =
    useMapStore();
  const createProjectMutation = useCreateProject();

  const [name, setName] = useState('');
  const [projectType, setProjectType] = useState('Reforestation');
  const [country, setCountry] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide a project name.');
      return;
    }

    if (!country.trim()) {
      setError('Please specify the host country.');
      return;
    }

    try {
      const created = await createProjectMutation.mutateAsync({
        name: name.trim(),
        project_type: projectType,
        country: country.trim(),
        description: description.trim() || undefined,
      });

      setSelectedProjectId(created.id);
      setIsCreateProjectModalOpen(false);
      setName('');
      setCountry('');
      setDescription('');
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to create project.');
    }
  };

  return (
    <Modal
      isOpen={isCreateProjectModalOpen}
      onClose={() => setIsCreateProjectModalOpen(false)}
      title="Create New Carbon & Biodiversity Project"
      subtitle="Establish a new project container to manage geographical sites"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 text-xs rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Project Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Congo Basin Peatland Conservation"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-earth-dark border border-earth-border rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Project Methodology
            </label>
            <select
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              className="w-full bg-earth-dark border border-earth-border rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            >
              {PROJECT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Country / Jurisdiction <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Democratic Republic of Congo"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full bg-earth-dark border border-earth-border rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Project Description & Objectives
          </label>
          <textarea
            rows={3}
            placeholder="Scope of ecological intervention, local community engagement, and carbon credit standards (Verra VCS / Gold Standard)..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-earth-dark border border-earth-border rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500 resize-none"
          />
        </div>

        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={() => setIsCreateProjectModalOpen(false)}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-earth-border/40 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createProjectMutation.isPending}
            className="flex items-center space-x-1.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-md shadow-brand-950 transition"
          >
            <Check className="w-4 h-4" />
            <span>
              {createProjectMutation.isPending ? 'Creating Project...' : 'Create Project'}
            </span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
