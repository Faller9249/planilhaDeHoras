import { Activity } from '../../domain/entities/Activity';

// Interface (Port) para parser de PDF - Inversão de Dependência (SOLID)
export interface IPDFParser {
  parse(file: File, collaborator: string): Promise<Activity[]>;
}
