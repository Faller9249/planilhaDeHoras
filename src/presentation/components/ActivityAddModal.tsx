import { useState } from 'react';
import { X, Save, Clock, Plus } from 'lucide-react';
import { Activity } from '../../domain/entities/Activity';

interface ActivityAddModalProps {
  onClose: () => void;
  onSave: (newActivity: Activity) => void;
  collaborator?: string;
}

export const ActivityAddModal = ({ onClose, onSave, collaborator = 'Eduardo Faller' }: ActivityAddModalProps) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('08:00');
  const [duration, setDuration] = useState('1:00');
  const [task, setTask] = useState('');

  const handleSave = () => {
    if (!task.trim()) {
      alert('Por favor, preencha a descrição da tarefa');
      return;
    }

    // Criar nova atividade
    const newActivity = Activity.create({
      date: new Date(date + 'T00:00:00'),
      startTime,
      duration,
      task: task.trim(),
      collaborator
    });

    onSave(newActivity);
    onClose();
  };

  const calculateEndTime = (start: string, dur: string): string => {
    try {
      const [startHours, startMinutes] = start.split(':').map(Number);
      const [durationHours, durationMinutes] = dur.split(':').map(Number);

      const totalMinutes = (startHours * 60 + startMinutes) + (durationHours * 60 + durationMinutes);
      const endHours = Math.floor(totalMinutes / 60);
      const endMinutes = totalMinutes % 60;

      return `${endHours}:${endMinutes.toString().padStart(2, '0')}`;
    } catch {
      return '--:--';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-geocapex-dark flex items-center gap-2">
            <Plus className="text-geocapex-orange" size={28} />
            Nova Atividade
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-geocapex-dark transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            {/* Data */}
            <div>
              <label className="block text-sm font-medium text-geocapex-dark mb-2">
                Data
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 border border-geocapex-yellow rounded-lg focus:ring-2 focus:ring-geocapex-orange focus:border-transparent"
              />
            </div>

            {/* Horário de Início */}
            <div>
              <label className="block text-sm font-medium text-geocapex-dark mb-2">
                Horário de Início
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-2 border border-geocapex-yellow rounded-lg focus:ring-2 focus:ring-geocapex-orange focus:border-transparent"
              />
            </div>

            {/* Duração */}
            <div>
              <label className="block text-sm font-medium text-geocapex-dark mb-2">
                Duração (HH:MM)
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="1:30"
                className="w-full px-4 py-2 border border-geocapex-yellow rounded-lg focus:ring-2 focus:ring-geocapex-orange focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Formato: horas:minutos (ex: 1:30 para 1 hora e 30 minutos)</p>
            </div>

            {/* Horário de Término (calculado) */}
            <div>
              <label className="block text-sm font-medium text-geocapex-dark mb-2">
                Horário de Término (calculado)
              </label>
              <input
                type="text"
                value={calculateEndTime(startTime, duration)}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed font-semibold"
              />
            </div>

            {/* Tarefa */}
            <div>
              <label className="block text-sm font-medium text-geocapex-dark mb-2">
                Tarefa *
              </label>
              <textarea
                value={task}
                onChange={(e) => setTask(e.target.value)}
                rows={3}
                placeholder="DD - NN - Descrição da atividade (ex: 01 - 01 - Revisão tarefas do dia)"
                className="w-full px-4 py-2 border border-geocapex-yellow rounded-lg focus:ring-2 focus:ring-geocapex-orange focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">Recomendado: seguir o padrão DD - NN - Descrição</p>
            </div>

            {/* Colaborador */}
            <div>
              <label className="block text-sm font-medium text-geocapex-dark mb-2">
                Colaborador
              </label>
              <input
                type="text"
                value={collaborator}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-6 flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-geocapex-dark rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="bg-geocapex-orange hover:bg-orange-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-md"
            >
              <Save size={20} />
              Adicionar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
