import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { SiteCreateInput, SiteFeature, SiteFeatureCollection } from '../types';

export function useSites(projectId?: string | null) {
  return useQuery({
    queryKey: ['sites', projectId],
    queryFn: async () => {
      const url = projectId ? `/sites?project_id=${projectId}` : '/sites';
      const res = await api.get<SiteFeatureCollection>(url);
      return res.data;
    },
  });
}

export function useSite(id: string | null) {
  return useQuery({
    queryKey: ['site', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await api.get<SiteFeature>(`/sites/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SiteCreateInput) => {
      const res = await api.post<SiteFeature>('/sites', input);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project'] });
    },
  });
}

export function useDeleteSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/sites/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project'] });
    },
  });
}
