// Container de Injeção de Dependências
// Centraliza a criação e configuração de todas as dependências da aplicação

import { InMemoryActivityRepository } from './repositories/InMemoryActivityRepository';
import { TMetricPDFParser } from './adapters/TMetricPDFParser';
import { TMetricExcelParser } from './adapters/TMetricExcelParser';
import { ExcelJSExporter } from './adapters/ExcelJSExporter';

import { ProcessPDFFileUseCase } from '../application/use-cases/ProcessPDFFileUseCase';
import { ProcessExcelFileUseCase } from '../application/use-cases/ProcessExcelFileUseCase';
import { GetActivitiesUseCase } from '../application/use-cases/GetActivitiesUseCase';
import { ExportToExcelUseCase } from '../application/use-cases/ExportToExcelUseCase';
import { GetActivitiesStatisticsUseCase } from '../application/use-cases/GetActivitiesStatisticsUseCase';
import { ClearAllActivitiesUseCase } from '../application/use-cases/ClearAllActivitiesUseCase';

export class DependencyContainer {
  private static instance: DependencyContainer;

  // Repositórios
  private readonly activityRepository = new InMemoryActivityRepository();

  // Adapters
  private readonly pdfParser = new TMetricPDFParser();
  private readonly excelParser = new TMetricExcelParser();
  private readonly excelExporter = new ExcelJSExporter();

  // Use Cases
  public readonly processPDFFileUseCase = new ProcessPDFFileUseCase(
    this.pdfParser,
    this.activityRepository
  );

  public readonly processExcelFileUseCase = new ProcessExcelFileUseCase(
    this.excelParser,
    this.activityRepository
  );

  public readonly getActivitiesUseCase = new GetActivitiesUseCase(
    this.activityRepository
  );

  public readonly exportToExcelUseCase = new ExportToExcelUseCase(
    this.excelExporter,
    this.activityRepository
  );

  public readonly getActivitiesStatisticsUseCase = new GetActivitiesStatisticsUseCase(
    this.activityRepository
  );

  public readonly clearAllActivitiesUseCase = new ClearAllActivitiesUseCase(
    this.activityRepository
  );

  private constructor() {}

  public static getInstance(): DependencyContainer {
    if (!DependencyContainer.instance) {
      DependencyContainer.instance = new DependencyContainer();
    }
    return DependencyContainer.instance;
  }

  // Método para facilitar troca de implementações (ex: trocar repositório em memória por banco de dados)
  public getActivityRepository() {
    return this.activityRepository;
  }

  // Métodos para acessar parsers e exporters (para passar horários entre eles)
  public getExcelParser() {
    return this.excelParser;
  }

  public getExcelExporter() {
    return this.excelExporter;
  }
}
