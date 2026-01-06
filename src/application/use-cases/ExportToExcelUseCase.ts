import { Activity } from '../../domain/entities/Activity';
import { IExcelExporter } from '../ports/IExcelExporter';
import { IActivityRepository } from '../../domain/repositories/IActivityRepository';

// Use Case para exportar atividades para Excel
export class ExportToExcelUseCase {
  constructor(
    private readonly excelExporter: IExcelExporter,
    private readonly activityRepository: IActivityRepository
  ) {}

  async execute(activities?: Activity[]): Promise<void> {
    const activitiesToExport = activities || await this.activityRepository.findAll();

    if (activitiesToExport.length === 0) {
      throw new Error('Não há atividades para exportar');
    }

    await this.excelExporter.export(activitiesToExport);
  }
}
