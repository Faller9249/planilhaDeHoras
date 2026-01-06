import { Activity } from '../entities/Activity';

// Serviço de domínio para lógica de negócio que envolve múltiplas entidades
export class ActivityDomainService {
  // Agrupa atividades por data
  static groupByDate(activities: Activity[]): Map<string, Activity[]> {
    const grouped = new Map<string, Activity[]>();

    activities.forEach(activity => {
      const dateKey = activity.date.toISOString().split('T')[0];
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(activity);
    });

    return grouped;
  }

  // Calcula total de horas de um conjunto de atividades
  static calculateTotalHours(activities: Activity[]): number {
    return activities.reduce((total, activity) => {
      return total + activity.getDurationInMinutes();
    }, 0);
  }

  // Converte minutos para formato HH:MM
  static minutesToTimeFormat(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  }

  // Converte hora HH:MM para minutos totais
  static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Ordena atividades por data e hora
  static sortActivities(
    activities: Activity[],
    sortBy: 'date' | 'startTime' | 'duration' | 'task' = 'date',
    order: 'asc' | 'desc' = 'asc'
  ): Activity[] {
    const sorted = [...activities].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          comparison = a.date.getTime() - b.date.getTime();
          if (comparison === 0) {
            // Converter hora para minutos para comparação numérica correta
            const aMinutes = this.timeToMinutes(a.startTime);
            const bMinutes = this.timeToMinutes(b.startTime);
            comparison = aMinutes - bMinutes;
          }
          break;
        case 'startTime':
          comparison = a.startTime.localeCompare(b.startTime);
          break;
        case 'duration':
          comparison = a.getDurationInMinutes() - b.getDurationInMinutes();
          break;
        case 'task':
          comparison = a.task.localeCompare(b.task);
          break;
      }

      return order === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }

  // Filtra atividades por critérios
  static filterActivities(
    activities: Activity[],
    filters: {
      dateFilter?: string;
      taskFilter?: string;
      collaboratorFilter?: string;
    }
  ): Activity[] {
    return activities.filter(activity => {
      const matchDate = !filters.dateFilter ||
        activity.date.toISOString().includes(filters.dateFilter);

      const matchTask = !filters.taskFilter ||
        activity.task.toLowerCase().includes(filters.taskFilter.toLowerCase());

      const matchCollaborator = !filters.collaboratorFilter ||
        activity.collaborator === filters.collaboratorFilter;

      return matchDate && matchTask && matchCollaborator;
    });
  }

  // Valida se uma atividade está dentro de um período de trabalho normal
  static isWithinWorkingHours(activity: Activity): boolean {
    const [startHour] = activity.startTime.split(':').map(Number);
    const endTime = activity.calculateEndTime();
    const [endHour] = endTime.split(':').map(Number);

    // Considera horário de trabalho entre 6h e 22h
    return startHour >= 6 && endHour <= 22;
  }

  // Detecta sobreposição de atividades
  static detectOverlaps(activities: Activity[]): Activity[][] {
    const overlaps: Activity[][] = [];
    const sorted = this.sortActivities(activities, 'startTime', 'asc');

    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];

      const currentEnd = current.calculateEndTime();

      if (currentEnd > next.startTime) {
        overlaps.push([current, next]);
      }
    }

    return overlaps;
  }

  // Calcula estatísticas de um conjunto de atividades
  static calculateStatistics(activities: Activity[]): {
    totalActivities: number;
    totalHours: number;
    totalHoursFormatted: string;
    uniqueDates: number;
    averageHoursPerDay: number;
  } {
    const totalMinutes = this.calculateTotalHours(activities);
    const uniqueDates = new Set(
      activities.map(a => a.date.toISOString().split('T')[0])
    ).size;

    return {
      totalActivities: activities.length,
      totalHours: totalMinutes / 60,
      totalHoursFormatted: this.minutesToTimeFormat(totalMinutes),
      uniqueDates,
      averageHoursPerDay: uniqueDates > 0 ? totalMinutes / 60 / uniqueDates : 0
    };
  }
}
