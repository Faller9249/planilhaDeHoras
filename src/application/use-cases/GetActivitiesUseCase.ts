import { Activity } from '../../domain/entities/Activity';
import { IActivityRepository } from '../../domain/repositories/IActivityRepository';
import { ActivityDomainService } from '../../domain/services/ActivityDomainService';

export interface GetActivitiesFilters {
  dateFilter?: string;
  taskFilter?: string;
  collaboratorFilter?: string;
  sortBy?: 'date' | 'startTime' | 'duration' | 'task';
  sortOrder?: 'asc' | 'desc';
}

// Use Case para obter e filtrar atividades
export class GetActivitiesUseCase {
  constructor(private readonly activityRepository: IActivityRepository) {}

  async execute(filters?: GetActivitiesFilters): Promise<Activity[]> {
    let activities = await this.activityRepository.findAll();

    if (filters) {
      // Aplicar filtros
      if (filters.dateFilter || filters.taskFilter || filters.collaboratorFilter) {
        activities = ActivityDomainService.filterActivities(activities, {
          dateFilter: filters.dateFilter,
          taskFilter: filters.taskFilter,
          collaboratorFilter: filters.collaboratorFilter
        });
      }

      // Aplicar ordenação
      if (filters.sortBy) {
        activities = ActivityDomainService.sortActivities(
          activities,
          filters.sortBy,
          filters.sortOrder || 'asc'
        );
      } else {
        // SEMPRE ordenar por data + hora de início quando não especificado
        activities = ActivityDomainService.sortActivities(activities, 'date', 'asc');
      }
    } else {
      // SEMPRE ordenar por data + hora de início quando sem filtros
      activities = ActivityDomainService.sortActivities(activities, 'date', 'asc');
    }

    return activities;
  }
}
