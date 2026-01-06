import { IActivityRepository } from '../../domain/repositories/IActivityRepository';

// Use Case para limpar todas as atividades
export class ClearAllActivitiesUseCase {
  constructor(private readonly activityRepository: IActivityRepository) {}

  async execute(): Promise<void> {
    await this.activityRepository.deleteAll();
  }
}
