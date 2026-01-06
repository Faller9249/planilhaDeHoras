import { useState } from 'react';
import { X, AlertTriangle, Save, Clock } from 'lucide-react';
import { Activity } from '../../domain/entities/Activity';

interface ActivityEditModalProps {
  activity: Activity;
  onClose: () => void;
  onSave: (updatedActivity: Activity) => void;
}

export const ActivityEditModal = ({ activity, onClose, onSave }: ActivityEditModalProps) => {
  const [startTime, setStartTime] = useState(activity.startTime);
  const [duration, setDuration] = useState(activity.duration);
  const [task, setTask] = useState(activity.task);

  const handleSave = () => {
    // Criar uma cópia da atividade com os novos valores
    const updatedActivity = Activity.reconstruct({
      id: activity.id,
      date: activity.date,
      startTime,
      duration,
      task,
      collaborator: activity.collaborator,
      validationWarnings: activity.validationWarnings,
      hasValidationIssues: activity.hasValidationIssues
    });

    onSave(updatedActivity);
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
            <Clock className="text-geocapex-orange" size={28} />
            Editar Atividade
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
          {/* Avisos de Validação */}
          {activity.hasValidationIssues && activity.validationWarnings.length > 0 && (
            <div className="mb-6 bg-yellow-50 border border-yellow-400 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-800 mb-2">Avisos de Validação:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700">
                    {activity.validationWarnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <div className="space-y-4">
            {/* Data (readonly) */}
            <div>
              <label className="block text-sm font-medium text-geocapex-dark mb-2">
                Data
              </label>
              <input
                type="text"
                value={activity.date.toLocaleDateString('pt-BR')}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
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
                Tarefa
              </label>
              <textarea
                value={task}
                onChange={(e) => setTask(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-geocapex-yellow rounded-lg focus:ring-2 focus:ring-geocapex-orange focus:border-transparent resize-none"
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
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
