import { Activity } from '../../domain/entities/Activity';
import { DaySchedule } from '../../domain/value-objects/DaySchedule';

// Interface (Port) para exportador de Excel - Inversão de Dependência (SOLID)
export interface IExcelExporter {
  export(activities: Activity[]): Promise<void>;
  setDaySchedules?(schedules: Map<string, DaySchedule>): void;
}
