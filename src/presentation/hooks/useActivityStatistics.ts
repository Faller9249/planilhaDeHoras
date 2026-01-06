import { useState, useCallback, useEffect } from 'react';
import { DependencyContainer } from '../../infrastructure/DependencyContainer';
import { ActivitiesStatistics } from '../../application/use-cases/GetActivitiesStatisticsUseCase';

// Custom Hook para estatísticas de atividades
export const useActivityStatistics = () => {
  const [statistics, setStatistics] = useState<ActivitiesStatistics>({
    totalActivities: 0,
    totalHours: 0,
    totalHoursFormatted: '0:00',
    uniqueDates: 0,
    averageHoursPerDay: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const container = DependencyContainer.getInstance();

  const loadStatistics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await container.getActivitiesStatisticsUseCase.execute();
      setStatistics(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas');
      console.error('Erro ao carregar estatísticas:', err);
    } finally {
      setLoading(false);
    }
  }, [container]);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  return {
    statistics,
    loading,
    error,
    refresh: loadStatistics
  };
};
