import { useState, ChangeEvent } from 'react';
import { Download, Calendar, Clock, User, Upload, FileText, Trash2, ArrowUpDown, ArrowUp, ArrowDown, HelpCircle, X, AlertTriangle, Edit, Plus } from 'lucide-react';
import { useActivities } from '../hooks/useActivities';
import { useActivityStatistics } from '../hooks/useActivityStatistics';
import { Activity } from '../../domain/entities/Activity';
import { ActivityDomainService } from '../../domain/services/ActivityDomainService';
import { ActivityEditModal } from '../components/ActivityEditModal';
import { ActivityAddModal } from '../components/ActivityAddModal';

type SortColumn = 'date' | 'startTime' | 'duration' | 'task' | null;
type SortDirection = 'asc' | 'desc';

const ActivitiesPage = () => {
  const {
    activities,
    loading,
    processPDFFiles,
    processExcelFiles,
    exportToExcel,
    updateActivity,
    deleteActivity,
    addActivity,
    clearAllActivities,
    loadActivities
  } = useActivities();

  const { statistics } = useActivityStatistics();

  const [dateFilter, setDateFilter] = useState<string>('');
  const [taskFilter, setTaskFilter] = useState<string>('');
  const [sortColumn, setSortColumn] = useState<SortColumn>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Filtrar atividades
  const filteredActivities = ActivityDomainService.filterActivities(activities, {
    dateFilter,
    taskFilter
  });

  // Ordenar atividades
  const sortedActivities = sortColumn
    ? ActivityDomainService.sortActivities(filteredActivities, sortColumn, sortDirection)
    : filteredActivities;

  // Alternar ordenação
  const toggleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Upload de arquivos
  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (fileList && fileList.length > 0) {
      const filesArray: File[] = Array.from(fileList);

      const isPDF = filesArray.every(f => f.name.toLowerCase().endsWith('.pdf'));
      const isCSV = filesArray.every(f =>
        f.name.toLowerCase().endsWith('.csv') ||
        f.name.toLowerCase().endsWith('.xlsx') ||
        f.name.toLowerCase().endsWith('.xls')
      );

      let result;
      if (isPDF) {
        result = await processPDFFiles(filesArray);
      } else if (isCSV) {
        result = await processExcelFiles(filesArray);
      } else {
        alert('Por favor, selecione apenas arquivos PDF ou CSV/Excel');
        event.target.value = '';
        return;
      }

      if (result?.success) {
        setUploadedFiles(prev => [...prev, ...filesArray.map(f => f.name)]);
        alert(result.message);
      } else {
        alert(result?.message || 'Erro ao processar arquivos');
      }
    }
    event.target.value = '';
  };

  // Carregar dados de exemplo
  const loadSampleData = async () => {
    // Limpar dados existentes
    await clearAllActivities();

    // Criar atividades de exemplo
    const sampleActivities = [
      Activity.create({
        date: new Date('2025-09-01'),
        startTime: '8:00',
        duration: '0:25',
        task: '01 - 01 - Revisão tarefas do dia',
        collaborator: 'Eduardo Faller'
      }),
      Activity.create({
        date: new Date('2025-09-01'),
        startTime: '8:25',
        duration: '0:14',
        task: '01 - 02 - Daily',
        collaborator: 'Eduardo Faller'
      }),
      Activity.create({
        date: new Date('2025-09-01'),
        startTime: '8:39',
        duration: '1:31',
        task: '01 - 03 - Estudando tipagem no typescript',
        collaborator: 'Eduardo Faller'
      })
    ];

    // Salvar via repositório
    const container = await import('../../infrastructure/DependencyContainer').then(m => m.DependencyContainer.getInstance());
    await container.getActivityRepository().saveMany(sampleActivities);

    // Recarregar
    await loadActivities();
    setUploadedFiles(['Dados de exemplo']);
  };

  // Excluir atividade com confirmação
  const handleDeleteActivity = async (activity: Activity) => {
    const confirmDelete = window.confirm(
      `Tem certeza que deseja excluir esta atividade?\n\n` +
      `Data: ${activity.date.toLocaleDateString('pt-BR')}\n` +
      `Horário: ${activity.startTime}\n` +
      `Tarefa: ${activity.task}`
    );

    if (confirmDelete) {
      await deleteActivity(activity.id);
    }
  };

  // Ícone de ordenação
  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown size={14} className="opacity-50" />;
    }
    return sortDirection === 'asc' ?
      <ArrowUp size={14} className="text-geocapex-yellow" /> :
      <ArrowDown size={14} className="text-geocapex-yellow" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br p-8 font-baloo">
      <div className="max-w-7xl mx-auto">
        {/* Modal de Edição */}
        {editingActivity && (
          <ActivityEditModal
            activity={editingActivity}
            onClose={() => setEditingActivity(null)}
            onSave={updateActivity}
          />
        )}

        {/* Modal de Adicionar */}
        {showAddModal && (
          <ActivityAddModal
            onClose={() => setShowAddModal(false)}
            onSave={addActivity}
            collaborator="Eduardo Faller"
          />
        )}

        {/* Modal de Ajuda */}
        {showHelpModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-geocapex-white flex items-center gap-2">
                  <HelpCircle className="text-geocapex-orange" size={28} />
                  Como formatar no TMetric
                </h2>
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="text-gray-500 hover:text-geocapex-dark transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-4 bg-yellow-50 border border-geocapex-yellow rounded-lg p-4">
                  <h3 className="font-semibold text-geocapex-dark mb-2">📋 Formato das tarefas:</h3>
                  <p className="text-sm text-geocapex-dark mb-2">
                    As tarefas devem seguir o padrão: <code className="bg-white px-2 py-1 rounded">DD - NN - Descrição</code>
                  </p>
                  <ul className="text-sm text-geocapex-dark list-disc list-inside space-y-1">
                    <li><strong>DD</strong> = Dia do mês (01, 02, 03...)</li>
                    <li><strong>NN</strong> = Número sequencial da tarefa no dia (01, 02, 03...)</li>
                    <li><strong>Descrição</strong> = Descrição da atividade realizada</li>
                  </ul>
                  <p className="text-sm text-geocapex-dark mt-3">
                    <strong>Exemplo:</strong> <code className="bg-white px-2 py-1 rounded">01 - 01 - Revisão tarefas do dia</code>
                  </p>
                </div>

                <div className="mb-4 bg-orange-50 border border-geocapex-orange rounded-lg p-4">
                  <h3 className="font-semibold text-geocapex-white mb-2">🏷️ Etiquetas especiais (CSV/Excel):</h3>
                  <p className="text-sm text-geocapex-dark mb-3">
                    Para gerar corretamente o Excel com os horários de expediente, você deve usar <strong>4 etiquetas obrigatórias</strong> por dia no TMetric:
                  </p>
                  <ul className="text-sm text-geocapex-white list-disc list-inside space-y-1">
                    <li><strong>inicio HH:MM</strong> - Horário de início do expediente (ex: inicio 8:30)</li>
                    <li><strong>almoco HH:MM</strong> - Horário de início da pausa para almoço (ex: almoco 12:00)</li>
                    <li><strong>retorno almoco HH:MM</strong> - Horário de retorno do almoço (ex: retorno almoco 13:00)</li>
                    <li><strong>final HH:MM</strong> - Horário de encerramento do expediente (ex: final 18:00)</li>
                  </ul>

                  <div className="mt-3 bg-white border border-geocapex-orange rounded p-3">
                    <p className="text-sm text-geocapex-dark font-semibold mb-2">📋 Como funciona no Excel:</p>
                    <p className="text-sm text-geocapex-dark mb-2">
                      O sistema cria <strong>duas linhas por dia</strong> na aba "Lancto Horas":
                    </p>
                    <ul className="text-sm text-geocapex-dark list-disc list-inside space-y-1 ml-3">
                      <li><strong>Linha da Manhã:</strong> Inicio = <code className="bg-gray-100 px-1">inicio</code>, Fim = <code className="bg-gray-100 px-1">almoco</code></li>
                      <li><strong>Linha da Tarde:</strong> Inicio = <code className="bg-gray-100 px-1">retorno almoco</code>, Fim = <code className="bg-gray-100 px-1">final</code></li>
                    </ul>
                  </div>

                  <div className="mt-3 bg-yellow-50 border border-yellow-400 rounded p-3">
                    <p className="text-sm text-geocapex-dark font-semibold mb-1">⚠️ Importante:</p>
                    <ul className="text-sm text-geocapex-dark list-disc list-inside space-y-1 ml-3">
                      <li>Use essas 4 etiquetas em qualquer tarefa do dia (de preferência na primeira ou última)</li>
                      <li>As etiquetas devem estar no formato: <code className="bg-white px-1">etiqueta HH:MM</code></li>
                      <li>Ao importar múltiplos CSVs semanais, importe todos antes de gerar o Excel final</li>
                    </ul>
                  </div>
                </div>

                <div className="border-2 border-geocapex-yellow rounded-lg overflow-hidden">
                  <div className="bg-geocapex-dark text-white p-3 font-semibold">
                    📸 Exemplo visual do TMetric
                  </div>
                  <img
                    src="/docs/exemploTmetric.png"
                    alt="Exemplo de formatação no TMetric"
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="header rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col items-center mb-2">
            <div className='logo bg-#F15D22] rounded-lg p-2 flex items-center justify-center mb-2'>
              <svg width="270" height="95" viewBox="0 0 200 71" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M75.7842 42.2284C75.7842 42.633 75.6826 42.9648 75.4793 43.2247C75.2755 43.4847 74.9605 43.7207 74.5346 43.9323C74.0308 44.2019 73.3333 44.4231 72.4425 44.5964C71.5514 44.7697 70.6413 44.8563 69.7116 44.8563C68.3354 44.8563 67.0714 44.6782 65.9191 44.322C64.7668 43.9659 63.7739 43.4124 62.941 42.6617C62.1077 41.911 61.4593 40.9578 60.994 39.8026C60.5295 38.6473 60.2969 37.2809 60.2969 35.702C60.2969 34.1618 60.5387 32.8141 61.0233 31.6589C61.5075 30.5036 62.1607 29.5461 62.9844 28.7854C63.8077 28.0251 64.776 27.4525 65.8902 27.0671C67.0039 26.6822 68.1904 26.4893 69.4496 26.4893C70.2821 26.4893 71.0479 26.5615 71.745 26.7061C72.4425 26.8507 73.0428 27.0384 73.5471 27.2691C74.0505 27.5004 74.4378 27.7651 74.709 28.0634C74.9802 28.3621 75.1161 28.6748 75.1161 29.0018C75.1161 29.3292 75.0284 29.6131 74.8545 29.8539C74.6797 30.0952 74.4667 30.2824 74.2152 30.417C73.6921 30.09 73.0721 29.7817 72.3553 29.493C71.6385 29.2038 70.7377 29.0597 69.6533 29.0597C68.7814 29.0597 67.9678 29.2038 67.2125 29.493C66.4571 29.7817 65.8034 30.2058 65.2509 30.7636C64.6989 31.3223 64.2677 32.0155 63.958 32.8428C63.6482 33.6711 63.4931 34.6238 63.4931 35.702C63.4931 36.838 63.653 37.8248 63.9724 38.6621C64.2923 39.4991 64.7282 40.1879 65.2798 40.727C65.8323 41.2661 66.4904 41.6654 67.2558 41.9254C68.0208 42.1849 68.8494 42.3151 69.7405 42.3151C70.3601 42.3151 70.941 42.262 71.4839 42.1561C72.0259 42.0508 72.4425 41.9206 72.733 41.766V37.1459H68.7236C68.6263 37.0301 68.5444 36.862 68.4761 36.6404C68.4081 36.4192 68.3748 36.1932 68.3748 35.9615C68.3748 35.5195 68.4761 35.1921 68.6798 34.98C68.8831 34.7679 69.1591 34.6621 69.5079 34.6621H74.3892C74.7962 34.6621 75.1305 34.7823 75.3916 35.0231C75.6532 35.2643 75.7842 35.6057 75.7842 36.0486V42.2284Z"
                  fill="white" />
                <path
                  d="M85.1109 32.8718C84.0453 32.8718 83.1594 33.228 82.4527 33.94C81.7446 34.6528 81.3722 35.6731 81.3337 37.0012L88.4815 35.9905C88.4044 35.1244 88.0845 34.3876 87.5228 33.7815C86.9607 33.1749 86.1571 32.8718 85.1109 32.8718ZM81.508 39.225C81.7793 40.3223 82.3072 41.1362 83.0919 41.6652C83.8762 42.1947 84.8787 42.4595 86.0989 42.4595C86.9125 42.4595 87.6578 42.3341 88.3364 42.0837C89.0142 41.8337 89.5567 41.5642 89.9637 41.2755C90.5057 41.5838 90.7773 42.0166 90.7773 42.5749C90.7773 42.9023 90.6511 43.2054 90.3992 43.4845C90.1473 43.7641 89.8038 44.004 89.3678 44.2065C88.9323 44.4085 88.4188 44.5675 87.8278 44.6829C87.2372 44.7987 86.6023 44.8562 85.9245 44.8562C84.8011 44.8562 83.7789 44.702 82.8588 44.3942C81.9392 44.0867 81.1492 43.6243 80.4911 43.0077C79.8322 42.392 79.3239 41.6317 78.9655 40.7268C78.6067 39.822 78.4279 38.773 78.4279 37.579C78.4279 36.4238 78.6027 35.4083 78.9506 34.5322C79.2994 33.6565 79.7739 32.925 80.3746 32.3371C80.9753 31.7506 81.6824 31.3025 82.4961 30.9942C83.3097 30.6868 84.1811 30.5326 85.1109 30.5326C86.041 30.5326 86.8884 30.682 87.6538 30.9798C88.4188 31.279 89.0773 31.6927 89.6294 32.2222C90.1814 32.7517 90.6073 33.3822 90.9079 34.1137C91.208 34.8453 91.3583 35.6443 91.3583 36.5104C91.3583 36.992 91.2422 37.3434 91.0095 37.5642C90.7773 37.7858 90.4378 37.9356 89.9926 38.0123L81.508 39.225Z"
                  fill="white" />
                <path
                  d="M100.046 32.9582C98.8838 32.9582 97.9638 33.3723 97.2855 34.2006C96.6073 35.0283 96.2686 36.1932 96.2686 37.6946C96.2686 39.196 96.5981 40.356 97.2566 41.1742C97.9151 41.9929 98.8449 42.4017 100.046 42.4017C101.247 42.4017 102.177 41.9929 102.835 41.1742C103.494 40.356 103.823 39.196 103.823 37.6946C103.823 36.2123 103.489 35.0523 102.821 34.2145C102.153 33.3771 101.227 32.9582 100.046 32.9582ZM106.933 37.6946C106.933 38.7919 106.768 39.7838 106.439 40.6691C106.109 41.5548 105.649 42.3055 105.058 42.9217C104.467 43.5378 103.746 44.0146 102.894 44.3508C102.041 44.6878 101.093 44.8563 100.046 44.8563C99 44.8563 98.0505 44.6878 97.1988 44.3508C96.3461 44.0146 95.6245 43.5378 95.0339 42.9217C94.4429 42.3055 93.9828 41.5548 93.6538 40.6691C93.3239 39.7838 93.1596 38.7919 93.1596 37.6946C93.1596 36.5968 93.3239 35.6057 93.6538 34.72C93.9828 33.8348 94.4477 33.0836 95.0484 32.4675C95.6486 31.8513 96.3751 31.375 97.2277 31.0379C98.0799 30.7013 99.0192 30.5328 100.046 30.5328C101.073 30.5328 102.012 30.7013 102.865 31.0379C103.717 31.375 104.443 31.8566 105.044 32.4819C105.644 33.108 106.109 33.8583 106.439 34.7344C106.768 35.611 106.933 36.5968 106.933 37.6946Z"
                  fill="white" />
                <path
                  d="M123.117 28.8286C123.117 29.0986 123.035 29.3294 122.87 29.5219C122.706 29.7143 122.516 29.8589 122.304 29.9551C121.799 29.6085 121.209 29.2811 120.531 28.9732C119.853 28.6654 118.971 28.5112 117.886 28.5112C116.995 28.5112 116.172 28.6654 115.417 28.9732C114.661 29.2811 114.003 29.7339 113.441 30.3305C112.879 30.9271 112.439 31.6782 112.119 32.5831C111.799 33.4879 111.64 34.5278 111.64 35.7017C111.64 36.8957 111.794 37.9355 112.104 38.8204C112.414 39.7061 112.846 40.4481 113.397 41.0446C113.95 41.6412 114.613 42.0888 115.388 42.3871C116.162 42.6858 117.025 42.8347 117.974 42.8347C118.981 42.8347 119.858 42.6954 120.604 42.4158C121.349 42.1372 121.974 41.8054 122.478 41.4195C122.671 41.4971 122.855 41.6364 123.03 41.8384C123.204 42.0405 123.291 42.2765 123.291 42.546C123.291 42.9506 123.059 43.3163 122.594 43.6434C122.148 43.9512 121.538 44.2256 120.764 44.4664C119.988 44.7072 119 44.8273 117.8 44.8273C116.579 44.8273 115.446 44.6349 114.4 44.2499C113.354 43.865 112.448 43.2924 111.683 42.5317C110.917 41.7714 110.312 40.8234 109.867 39.6873C109.421 38.5513 109.199 37.2227 109.199 35.7017C109.199 34.1811 109.426 32.8474 109.882 31.7021C110.336 30.5569 110.952 29.5989 111.727 28.8286C112.501 28.0588 113.407 27.4814 114.444 27.096C115.479 26.7111 116.569 26.5182 117.712 26.5182C118.507 26.5182 119.238 26.5861 119.906 26.7207C120.574 26.8552 121.146 27.0337 121.621 27.2549C122.095 27.4766 122.463 27.7265 122.725 28.0057C122.986 28.2848 123.117 28.5591 123.117 28.8286Z"
                  fill="white" />
                <path
                  d="M131.108 42.9504C131.921 42.9504 132.594 42.869 133.127 42.7048C133.659 42.5415 134.042 42.3826 134.275 42.2284V38.0412L130.672 38.4165C129.664 38.5132 128.918 38.7388 128.434 39.095C127.95 39.4516 127.708 39.9759 127.708 40.6691C127.708 41.4006 127.989 41.9637 128.55 42.3582C129.112 42.7531 129.965 42.9504 131.108 42.9504ZM131.079 30.7344C132.763 30.7344 134.1 31.1102 135.088 31.8609C136.076 32.6116 136.57 33.796 136.57 35.4128V42.2572C136.57 42.6808 136.488 43.0035 136.323 43.2247C136.158 43.4464 135.911 43.6532 135.582 43.8457C135.117 44.1152 134.502 44.3508 133.737 44.5533C132.972 44.7553 132.095 44.8563 131.108 44.8563C129.286 44.8563 127.877 44.4997 126.88 43.7877C125.882 43.0758 125.383 42.0455 125.383 40.6978C125.383 39.4272 125.8 38.4697 126.633 37.8248C127.465 37.1794 128.637 36.7801 130.149 36.626L134.275 36.2219V35.4128C134.275 34.4501 133.984 33.7477 133.403 33.3048C132.822 32.862 132.037 32.6403 131.049 32.6403C130.236 32.6403 129.47 32.7562 128.754 32.987C128.037 33.2182 127.398 33.4781 126.836 33.7668C126.681 33.6327 126.541 33.4781 126.415 33.3048C126.289 33.1315 126.226 32.9395 126.226 32.727C126.226 32.4579 126.294 32.2367 126.429 32.0629C126.565 31.8901 126.778 31.7268 127.068 31.5722C127.592 31.3027 128.192 31.0954 128.87 30.9513C129.548 30.8067 130.284 30.7344 131.079 30.7344Z"
                  fill="white" />
                <path
                  d="M145.636 42.9215C146.992 42.9215 148.081 42.5126 148.905 41.6944C149.728 40.8762 150.14 39.5621 150.14 37.7524C150.14 36.8092 150.018 36.0101 149.776 35.3552C149.534 34.7008 149.205 34.1713 148.788 33.7672C148.372 33.3626 147.892 33.0739 147.35 32.9006C146.808 32.7273 146.236 32.6407 145.636 32.6407C144.939 32.6407 144.348 32.7273 143.863 32.9006C143.379 33.0739 142.943 33.2664 142.556 33.478V41.9975C142.924 42.2671 143.359 42.4883 143.863 42.6616C144.367 42.8349 144.957 42.9215 145.636 42.9215ZM145.955 44.8275C145.277 44.8275 144.638 44.75 144.038 44.5967C143.437 44.4425 142.943 44.2597 142.556 44.0476V49.65C142.459 49.6883 142.314 49.7319 142.12 49.7798C141.926 49.8277 141.713 49.8521 141.481 49.8521C140.647 49.8521 140.231 49.4959 140.231 48.7839V33.5359C140.231 33.151 140.299 32.8427 140.435 32.6115C140.57 32.3807 140.851 32.1403 141.277 31.89C141.8 31.6013 142.425 31.3369 143.151 31.0957C143.878 30.8553 144.706 30.7347 145.636 30.7347C146.585 30.7347 147.481 30.8697 148.324 31.1388C149.167 31.4092 149.893 31.8273 150.503 32.3951C151.113 32.9633 151.597 33.6901 151.956 34.5753C152.314 35.4615 152.493 36.5205 152.493 37.7524C152.493 38.9459 152.333 39.9858 152.014 40.871C151.694 41.7567 151.244 42.4935 150.663 43.08C150.081 43.6679 149.389 44.1055 148.585 44.3942C147.781 44.6829 146.904 44.8275 145.955 44.8275Z"
                  fill="white" />
                <path
                  d="M161.181 32.6117C159.999 32.6117 159.021 33.021 158.246 33.8392C157.471 34.6574 157.064 35.8274 157.026 37.348L165.017 36.2502C164.919 35.1921 164.547 34.3208 163.898 33.6367C163.249 32.9539 162.343 32.6117 161.181 32.6117ZM157.171 39.1381C157.694 41.6607 159.36 42.9217 162.169 42.9217C162.982 42.9217 163.718 42.7871 164.377 42.5172C165.036 42.2481 165.559 41.9589 165.946 41.6511C166.412 41.9206 166.644 42.2864 166.644 42.748C166.644 43.0179 166.522 43.2779 166.281 43.5278C166.038 43.7787 165.709 43.9999 165.293 44.1923C164.876 44.3848 164.392 44.5389 163.84 44.6539C163.288 44.7697 162.692 44.8276 162.053 44.8276C159.805 44.8276 158.029 44.2211 156.721 43.0079C155.413 41.7952 154.76 40.0238 154.76 37.6946C154.76 36.5969 154.919 35.6202 155.239 34.7632C155.558 33.9071 156.004 33.1799 156.575 32.5834C157.147 31.9864 157.83 31.5291 158.624 31.2113C159.418 30.8938 160.28 30.7345 161.21 30.7345C162.082 30.7345 162.885 30.879 163.622 31.1682C164.358 31.4569 164.992 31.8657 165.525 32.3952C166.058 32.9252 166.474 33.5505 166.775 34.272C167.075 34.9944 167.225 35.7887 167.225 36.6548C167.225 37.0789 167.128 37.382 166.934 37.5644C166.74 37.7477 166.469 37.8583 166.121 37.8967L157.171 39.1381Z"
                  fill="white" />
                <path
                  d="M169.724 42.3725C170.324 41.5643 170.954 40.7748 171.613 40.005C172.27 39.2351 172.929 38.4452 173.588 37.6366C172.775 36.6547 172.019 35.7258 171.322 34.8502C170.625 33.974 169.908 33.0644 169.172 32.1208C169.249 31.7359 169.39 31.4376 169.593 31.2255C169.796 31.0139 170.062 30.9081 170.392 30.9081C170.721 30.9081 170.978 30.9899 171.162 31.1532C171.346 31.317 171.544 31.5334 171.758 31.8034C172.261 32.477 172.78 33.1942 173.312 33.9545C173.845 34.7152 174.402 35.4707 174.983 36.2218C175.7 35.317 176.378 34.4552 177.017 33.6366C177.656 32.8188 178.315 31.9187 178.993 30.9368C179.09 30.9177 179.196 30.9081 179.313 30.9081C179.719 30.9081 180.039 30.9995 180.271 31.1824C180.504 31.3657 180.62 31.6109 180.62 31.9187C180.62 32.1304 180.577 32.3329 180.489 32.5253C180.402 32.7178 180.262 32.9394 180.068 33.1894C179.467 33.9214 178.852 34.6673 178.223 35.4276C177.593 36.1883 176.969 36.9342 176.349 37.6653C177.104 38.6472 177.864 39.6148 178.63 40.5676C179.395 41.5208 180.155 42.4787 180.911 43.4411C180.872 43.8073 180.746 44.096 180.533 44.3072C180.32 44.5192 180.039 44.625 179.69 44.625C179.36 44.625 179.095 44.5427 178.891 44.3795C178.688 44.2162 178.45 43.961 178.18 43.6148C177.656 42.9216 177.119 42.1848 176.566 41.4049C176.014 40.6255 175.467 39.8704 174.925 39.138C174.246 40.0237 173.564 40.929 172.876 41.853C172.189 42.777 171.525 43.6914 170.886 44.5963H170.479C170.033 44.5963 169.699 44.4996 169.477 44.3072C169.254 44.1151 169.143 43.8743 169.143 43.5856C169.143 43.4319 169.176 43.2725 169.244 43.1088C169.312 42.9455 169.472 42.7004 169.724 42.3725Z"
                  fill="white" />
                <path d="M35.099 36V52C26.2674 52 19 44.7773 19 36C19 27.2227 26.2674 20 35.099 20V36Z"
                  fill="#FFCB05" />
                <path
                  d="M35.0996 36H51.1986C51.1986 40.2421 49.5012 44.3144 46.4833 47.3137C43.4654 50.3131 39.3675 52 35.0996 52V36Z"
                  fill="#F15D22" />
                <path d="M51.1988 31.127L40.0039 20.0005H51.1988" fill="#ffffffff" />
              </svg>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="flex flex-col text-center md:text-left gap-2 m-2">
              <h1 className="text-3xl font-bold text-geocapex-white flex items-center justify-center gap-3">
                <Calendar className="text-geocapex-orange" size={32} />
                Planilha de Atividades
              </h1>
              <p className="text-geocapex-white mt-2 flex items-center justify-start gap-2">
                <User size={24} />
              </p>
            </div>
            <button
              onClick={() => setShowHelpModal(true)}
              className="bg-geocapex-yellow hover:bg-yellow-500 text-geocapex-dark px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-md font-semibold"
            >
              <HelpCircle size={20} />
              Como usar
            </button>
          </div>

          {/* Upload de Arquivos */}
          <div className="border-2 border-dashed border-geocapex-yellow rounded-lg p-6 mb-4 bg-yellow-50">
            <div className="text-center">
              <Upload className="mx-auto text-geocapex-orange mb-3" size={40} />
              <h3 className="text-lg font-semibold text-geocapex-dark mb-2">
                Importar PDFs ou Excel/CSV do TMetric
              </h3>
              <p className="text-sm text-geocapex-dark mb-4">
                Faça upload dos relatórios em PDF ou Excel/CSV do TMetric
              </p>

              <div className="flex gap-3 justify-center">
                <label className="bg-geocapex-orange hover:bg-orange-600 text-white px-6 py-3 rounded-lg cursor-pointer flex items-center gap-2 transition-colors shadow-md">
                  <FileText size={20} />
                  Selecionar Arquivos
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={loading}
                  />
                </label>

                <button
                  onClick={loadSampleData}
                  className="bg-geocapex-yellow hover:bg-yellow-500 text-geocapex-dark px-6 py-3 rounded-lg flex items-center gap-2 transition-colors shadow-md font-semibold"
                  disabled={loading}
                >
                  Carregar Exemplo
                </button>

                {activities.length > 0 && (
                  <button
                    onClick={clearAllActivities}
                    className="bg-geocapex-dark hover:bg-gray-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors shadow-md"
                  >
                    <Trash2 size={20} />
                    Limpar
                  </button>
                )}
              </div>

              {loading && (
                <div className="mt-4 text-geocapex-orange font-medium">
                  Processando arquivos...
                </div>
              )}

              {uploadedFiles.length > 0 && (
                <div className="mt-4 text-sm text-geocapex-dark">
                  <strong>Arquivos carregados:</strong> {uploadedFiles.join(', ')}
                </div>
              )}
            </div>
          </div>

          {/* Estatísticas */}
          {activities.length > 0 && (
            <>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-yellow-50 p-4 rounded-lg border border-geocapex-yellow">
                  <div className="text-geocapex-orange text-sm font-semibold">Total de Atividades</div>
                  <div className="text-2xl font-bold text-geocapex-dark">{statistics.totalActivities}</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg border border-geocapex-orange">
                  <div className="text-geocapex-orange text-sm font-semibold">Total de Horas</div>
                  <div className="text-2xl font-bold text-geocapex-dark">{statistics.totalHoursFormatted}h</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-geocapex-dark">
                  <div className="text-geocapex-dark text-sm font-semibold">Dias Trabalhados</div>
                  <div className="text-2xl font-bold text-geocapex-dark">{statistics.uniqueDates}</div>
                </div>
              </div>

              {/* Filtros e Ações */}
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-sm font-medium text-geocapex-white mb-2">
                    Filtrar por Data
                  </label>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-geocapex-yellow rounded-lg focus:ring-2 focus:ring-geocapex-orange focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-geocapex-white mb-2">
                    Buscar Tarefa
                  </label>
                  <input
                    type="text"
                    value={taskFilter}
                    onChange={(e) => setTaskFilter(e.target.value)}
                    placeholder="Digite para buscar..."
                    className="w-full px-4 py-2 border border-geocapex-yellow rounded-lg focus:ring-2 focus:ring-geocapex-orange focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-geocapex-white mb-2">
                    Nova Atividade
                  </label>
                  <button
                    onClick={() => setShowAddModal(true)}
                    disabled={loading}
                    className="w-full bg-geocapex-yellow hover:bg-yellow-500 disabled:bg-gray-400 text-geocapex-dark px-6 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-md font-semibold"
                  >
                    <Plus size={20} />
                    Adicionar
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-geocapex-white mb-2">
                    Downloads
                  </label>
                  <button
                    onClick={() => exportToExcel(sortedActivities)}
                    disabled={sortedActivities.length === 0 || loading}
                    className="w-full bg-geocapex-orange hover:bg-orange-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-md"
                  >
                    <Download size={20} />
                    Baixar Excel
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="container">
          {/* Tabela */}
          {activities.length > 0 ? (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="overflow-x-auto" style={{ maxHeight: '600px' }}>
                <table className="w-full">
                  <thead className="bg-geocapex-dark text-white sticky top-0">
                    <tr>
                      <th
                        className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-gray-700 transition-colors select-none"
                        onClick={() => toggleSort('date')}
                      >
                        <div className="flex items-center gap-2">
                          Data
                          <SortIcon column="date" />
                        </div>
                      </th>
                      <th
                        className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-gray-700 transition-colors select-none"
                        onClick={() => toggleSort('startTime')}
                      >
                        <div className="flex items-center gap-2">
                          Hora Início
                          <SortIcon column="startTime" />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Hora Fim</th>
                      <th
                        className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-gray-700 transition-colors select-none"
                        onClick={() => toggleSort('duration')}
                      >
                        <div className="flex items-center gap-2">
                          Tempo
                          <SortIcon column="duration" />
                        </div>
                      </th>
                      <th
                        className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-gray-700 transition-colors select-none"
                        onClick={() => toggleSort('task')}
                      >
                        <div className="flex items-center gap-2">
                          Tarefa
                          <SortIcon column="task" />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sortedActivities.map((activity) => (
                      <tr
                        key={activity.id}
                        className={`hover:bg-yellow-50 transition-colors cursor-pointer ${activity.hasValidationIssues ? 'bg-yellow-50' : ''}`}
                      >
                        <td className="px-4 py-3 text-sm text-geocapex-dark">
                          {activity.date.toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 text-sm text-geocapex-dark">{activity.startTime}</td>
                        <td className="px-4 py-3 text-sm text-geocapex-dark">{activity.calculateEndTime()}</td>
                        <td className="px-4 py-3 text-sm font-medium text-geocapex-orange flex items-center gap-1">
                          <Clock size={14} />
                          {activity.duration}
                        </td>
                        <td className="px-4 py-3 text-sm text-geocapex-dark text-left">
                          <div className="flex items-center gap-2">
                            <div title={activity.validationWarnings.join(', ')}>
                              <AlertTriangle className="text-yellow-600 flex-shrink-0" size={16} />
                            </div>
                            <span>{activity.task}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setEditingActivity(activity)}
                              className="text-geocapex-orange hover:text-orange-600 transition-colors p-2 rounded-lg hover:bg-orange-50"
                              title="Editar atividade"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteActivity(activity)}
                              className="text-red-600 hover:text-red-700 transition-colors p-2 rounded-lg hover:bg-red-50"
                              title="Excluir atividade"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <FileText className="mx-auto text-geocapex-yellow mb-4" size={64} />
              <h3 className="text-xl font-semibold text-geocapex-dark mb-2">
                Nenhuma atividade carregada
              </h3>
              <p className="text-geocapex-dark">
                Faça upload dos PDFs do TMetric ou carregue dados de exemplo para começar
              </p>
            </div>
          )}
        </div>


      </div>
    </div>
  );
};

export default ActivitiesPage;
