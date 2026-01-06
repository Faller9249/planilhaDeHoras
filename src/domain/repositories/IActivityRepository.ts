import { Activity } from '../entities/Activity';

// Interface do repositório seguindo o padrão Repository do DDD
// Esta interface define o contrato, a implementação ficará na camada de infraestrutura
export interface IActivityRepository {
  // Operações CRUD básicas
  save(activity: Activity): Promise<void>;
  saveMany(activities: Activity[]): Promise<void>;
  findById(id: string): Promise<Activity | null>;
  findAll(): Promise<Activity[]>;
  update(activity: Activity): Promise<void>;
  delete(id: string): Promise<void>;
  deleteAll(): Promise<void>;

  // Queries específicas do domínio
  findByDate(date: Date): Promise<Activity[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<Activity[]>;
  findByCollaborator(collaborator: string): Promise<Activity[]>;
  findByTaskDescription(searchTerm: string): Promise<Activity[]>;

  // Estatísticas
  getTotalActivities(): Promise<number>;
  getTotalHoursByDate(date: Date): Promise<number>;
  getTotalHoursByDateRange(startDate: Date, endDate: Date): Promise<number>;
  getUniqueDates(): Promise<Date[]>;
}
