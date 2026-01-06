import { IActivityRepository } from '../../domain/repositories/IActivityRepository';
import { ActivityDomainService } from '../../domain/services/ActivityDomainService';

export interface ActivitiesStatistics {
  totalActivities: number;
  totalHours: number;
  totalHoursFormatted: string;
  uniqueDates: number;
  averageHoursPerDay: number;
}

// Use Case para obter estatísticas das atividades
export class GetActivitiesStatisticsUseCase {
  constructor(private readonly activityRepository: IActivityRepository) {}

  async execute(): Promise<ActivitiesStatistics> {
    const activities = await this.activityRepository.findAll();
    return ActivityDomainService.calculateStatistics(activities);
  }
}
