import { useState, useCallback, useEffect } from 'react';
import { Activity } from '../../domain/entities/Activity';
import { DependencyContainer } from '../../infrastructure/DependencyContainer';
import { GetActivitiesFilters } from '../../application/use-cases/GetActivitiesUseCase';

// Custom Hook para gerenciar atividades
export const useActivities = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const container = DependencyContainer.getInstance();

  // Carregar atividades
  const loadActivities = useCallback(async (filters?: GetActivitiesFilters) => {
    console.log('\n🔄 [useActivities] loadActivities chamado');
    console.log('   Filtros:', filters);
    setLoading(true);
    setError(null);
    try {
      const result = await container.getActivitiesUseCase.execute(filters);
      console.log(`✅ [useActivities] ${result.length} atividades carregadas do repositório`);
      result.forEach((activity, index) => {
        console.log(`   [${index + 1}] ${activity.date.toLocaleDateString('pt-BR')} - ${activity.startTime} - ${activity.task}`);
      });
      setActivities(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar atividades');
      console.error('❌ [useActivities] Erro ao carregar atividades:', err);
    } finally {
      setLoading(false);
    }
  }, [container]);

  // Processar arquivos PDF
  const processPDFFiles = useCallback(async (files: File[], collaborator?: string) => {
    console.log('\n📄 [useActivities] processPDFFiles chamado');
    console.log(`   ${files.length} arquivo(s) PDF:`, files.map(f => f.name));
    console.log('   Colaborador:', collaborator || 'Eduardo Faller');
    setLoading(true);
    setError(null);
    try {
      const result = await container.processPDFFileUseCase.execute(files, collaborator);
      console.log('📊 [useActivities] Resultado do processamento PDF:', result);
      if (result.success) {
        console.log('✅ [useActivities] PDF processado com sucesso, recarregando atividades...');
        await loadActivities();
      } else {
        console.log('⚠️ [useActivities] Processamento PDF não foi bem-sucedido');
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao processar PDFs';
      console.error('❌ [useActivities] Erro ao processar PDFs:', err);
      setError(message);
      return { success: false, activitiesProcessed: 0, message };
    } finally {
      setLoading(false);
    }
  }, [container, loadActivities]);

  // Processar arquivos Excel/CSV
  const processExcelFiles = useCallback(async (files: File[], collaborator?: string) => {
    console.log('\n📊 [useActivities] processExcelFiles chamado');
    console.log(`   ${files.length} arquivo(s) Excel/CSV:`, files.map(f => f.name));
    console.log('   Colaborador:', collaborator || 'Eduardo Faller');
    setLoading(true);
    setError(null);
    try {
      const result = await container.processExcelFileUseCase.execute(files, collaborator);
      console.log('📊 [useActivities] Resultado do processamento Excel:', result);
      if (result.success) {
        console.log('✅ [useActivities] Excel processado com sucesso, recarregando atividades...');
        await loadActivities();
      } else {
        console.log('⚠️ [useActivities] Processamento Excel não foi bem-sucedido');
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao processar Excel/CSV';
      console.error('❌ [useActivities] Erro ao processar Excel/CSV:', err);
      setError(message);
      return { success: false, activitiesProcessed: 0, message };
    } finally {
      setLoading(false);
    }
  }, [container, loadActivities]);

  // Exportar para Excel
  const exportToExcel = useCallback(async (filteredActivities?: Activity[]) => {
    console.log('\n📤 [useActivities] exportToExcel chamado');
    setLoading(true);
    setError(null);
    try {
      // Passar horários do parser para o exporter
      const excelParser = container.getExcelParser();
      const excelExporter = container.getExcelExporter();
      const daySchedules = excelParser.getDaySchedules();

      console.log(`📅 [useActivities] Transferindo ${daySchedules.size} horários de dias do parser para o exporter`);
      excelExporter.setDaySchedules(daySchedules);

      await container.exportToExcelUseCase.execute(filteredActivities);
      console.log('✅ [useActivities] Exportação concluída com sucesso');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao exportar Excel');
      console.error('❌ [useActivities] Erro ao exportar:', err);
    } finally {
      setLoading(false);
    }
  }, [container]);

  // Atualizar uma atividade
  const updateActivity = useCallback(async (activity: Activity) => {
    console.log('\n✏️ [useActivities] updateActivity chamado');
    console.log('   Atividade ID:', activity.id);
    setLoading(true);
    setError(null);
    try {
      await container.getActivityRepository().save(activity);
      console.log('✅ [useActivities] Atividade atualizada com sucesso');
      await loadActivities();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar atividade');
      console.error('❌ [useActivities] Erro ao atualizar:', err);
    } finally {
      setLoading(false);
    }
  }, [container, loadActivities]);

  // Excluir uma atividade
  const deleteActivity = useCallback(async (activityId: string) => {
    console.log('\n🗑️ [useActivities] deleteActivity chamado');
    console.log('   Atividade ID:', activityId);
    setLoading(true);
    setError(null);
    try {
      await container.getActivityRepository().delete(activityId);
      console.log('✅ [useActivities] Atividade excluída com sucesso');
      await loadActivities();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir atividade');
      console.error('❌ [useActivities] Erro ao excluir:', err);
    } finally {
      setLoading(false);
    }
  }, [container, loadActivities]);

  // Adicionar uma nova atividade
  const addActivity = useCallback(async (activity: Activity) => {
    console.log('\n➕ [useActivities] addActivity chamado');
    setLoading(true);
    setError(null);
    try {
      await container.getActivityRepository().save(activity);
      console.log('✅ [useActivities] Nova atividade adicionada com sucesso');
      await loadActivities();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar atividade');
      console.error('❌ [useActivities] Erro ao adicionar:', err);
    } finally {
      setLoading(false);
    }
  }, [container, loadActivities]);

  // Limpar todas as atividades
  const clearAllActivities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await container.clearAllActivitiesUseCase.execute();
      await loadActivities();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao limpar atividades');
      console.error('Erro ao limpar:', err);
    } finally {
      setLoading(false);
    }
  }, [container, loadActivities]);

  // Carregar atividades ao montar o componente
  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  return {
    activities,
    loading,
    error,
    loadActivities,
    processPDFFiles,
    processExcelFiles,
    exportToExcel,
    updateActivity,
    deleteActivity,
    addActivity,
    clearAllActivities
  };
};
