import { Activity } from '../../domain/entities/Activity';

// Interface (Port) para parser de Excel/CSV - Inversão de Dependência (SOLID)
export interface IExcelParser {
  parse(file: File, collaborator: string): Promise<Activity[]>;
}
