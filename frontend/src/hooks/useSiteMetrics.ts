import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { ProjectAnalyticsSummary, SiteAnalyticsSummary, SiteMetric } from '../types';

export function useSiteMetrics(siteId: string | null) {
  return useQuery({
    queryKey: ['site-metrics', siteId],
    queryFn: async () => {
      if (!siteId) return [];
      const res = await api.get<SiteMetric[]>(`/sites/${siteId}/metrics`);
      return res.data;
    },
    enabled: !!siteId,
  });
}

export function useSiteAnalytics(siteId: string | null) {
  return useQuery({
    queryKey: ['site-analytics', siteId],
    queryFn: async () => {
      if (!siteId) return null;
      const res = await api.get<SiteAnalyticsSummary>(`/sites/${siteId}/analytics`);
      return res.data;
    },
    enabled: !!siteId,
  });
}

export function useProjectAnalytics(projectId: string | null) {
  return useQuery({
    queryKey: ['project-analytics', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const res = await api.get<ProjectAnalyticsSummary>(`/projects/${projectId}/analytics`);
      return res.data;
    },
    enabled: !!projectId,
  });
}
