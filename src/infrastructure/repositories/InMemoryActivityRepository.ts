import { Activity } from '../../domain/entities/Activity';
import { IActivityRepository } from '../../domain/repositories/IActivityRepository';

// Implementação em memória do repositório (LocalStorage)
// Futuramente pode ser substituída por uma implementação com banco de dados
export class InMemoryActivityRepository implements IActivityRepository {
  private activities: Activity[] = [];
  private readonly STORAGE_KEY = 'activities_data';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        this.activities = parsed.map((item: any) =>
          Activity.reconstruct({
            id: item.id,
            date: new Date(item.date),
            startTime: item.startTime,
            duration: item.duration,
            task: item.task,
            collaborator: item.collaborator
          })
        );
      }
    } catch (error) {
      console.error('Erro ao carregar dados do localStorage:', error);
      this.activities = [];
    }
  }

  private saveToStorage(): void {
    try {
      const data = this.activities.map(activity => activity.toJSON());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Erro ao salvar dados no localStorage:', error);
    }
  }

  async save(activity: Activity): Promise<void> {
    this.activities.push(activity);
    this.saveToStorage();
  }

  async saveMany(activities: Activity[]): Promise<void> {
    this.activities.push(...activities);
    this.saveToStorage();
  }

  async findById(id: string): Promise<Activity | null> {
    return this.activities.find(a => a.id === id) || null;
  }

  async findAll(): Promise<Activity[]> {
    return [...this.activities];
  }

  async update(activity: Activity): Promise<void> {
    const index = this.activities.findIndex(a => a.id === activity.id);
    if (index !== -1) {
      this.activities[index] = activity;
      this.saveToStorage();
    }
  }

  async delete(id: string): Promise<void> {
    this.activities = this.activities.filter(a => a.id !== id);
    this.saveToStorage();
  }

  async deleteAll(): Promise<void> {
    this.activities = [];
    this.saveToStorage();
  }

  async findByDate(date: Date): Promise<Activity[]> {
    const targetDate = date.toISOString().split('T')[0];
    return this.activities.filter(a => {
      const activityDate = a.date.toISOString().split('T')[0];
      return activityDate === targetDate;
    });
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Activity[]> {
    return this.activities.filter(a => {
      return a.date >= startDate && a.date <= endDate;
    });
  }

  async findByCollaborator(collaborator: string): Promise<Activity[]> {
    return this.activities.filter(a => a.collaborator === collaborator);
  }

  async findByTaskDescription(searchTerm: string): Promise<Activity[]> {
    const lowerSearch = searchTerm.toLowerCase();
    return this.activities.filter(a =>
      a.task.toLowerCase().includes(lowerSearch)
    );
  }

  async getTotalActivities(): Promise<number> {
    return this.activities.length;
  }

  async getTotalHoursByDate(date: Date): Promise<number> {
    const activitiesOnDate = await this.findByDate(date);
    return activitiesOnDate.reduce((total, activity) => {
      return total + activity.getDurationInMinutes();
    }, 0);
  }

  async getTotalHoursByDateRange(startDate: Date, endDate: Date): Promise<number> {
    const activitiesInRange = await this.findByDateRange(startDate, endDate);
    return activitiesInRange.reduce((total, activity) => {
      return total + activity.getDurationInMinutes();
    }, 0);
  }

  async getUniqueDates(): Promise<Date[]> {
    const uniqueDatesSet = new Set<string>();
    this.activities.forEach(a => {
      uniqueDatesSet.add(a.date.toISOString().split('T')[0]);
    });
    return Array.from(uniqueDatesSet).map(d => new Date(d));
  }
}
