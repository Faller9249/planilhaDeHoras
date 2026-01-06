import { Activity } from '../../domain/entities/Activity';
import { IActivityRepository } from '../../domain/repositories/IActivityRepository';
import { IExcelParser } from '../ports/IExcelParser';

// Use Case para processar arquivos Excel/CSV
export class ProcessExcelFileUseCase {
  constructor(
    private readonly excelParser: IExcelParser,
    private readonly activityRepository: IActivityRepository
  ) {}

  async execute(files: File[], collaborator: string = 'Eduardo Faller'): Promise<{
    success: boolean;
    activitiesProcessed: number;
    message: string;
  }> {
    try {
      const allActivities: Activity[] = [];

      for (const file of files) {
        const parsedActivities = await this.excelParser.parse(file, collaborator);
        allActivities.push(...parsedActivities);
      }

      if (allActivities.length === 0) {
        return {
          success: false,
          activitiesProcessed: 0,
          message: 'Nenhuma atividade foi encontrada nos arquivos'
        };
      }

      await this.activityRepository.saveMany(allActivities);

      return {
        success: true,
        activitiesProcessed: allActivities.length,
        message: `✓ ${allActivities.length} atividades extraídas com sucesso!`
      };
    } catch (error) {
      console.error('Erro ao processar Excel/CSV:', error);
      return {
        success: false,
        activitiesProcessed: 0,
        message: error instanceof Error ? error.message : 'Erro desconhecido ao processar arquivos'
      };
    }
  }
}
