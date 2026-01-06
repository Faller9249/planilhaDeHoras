import { Activity } from '../../domain/entities/Activity';
import { DaySchedule } from '../../domain/value-objects/DaySchedule';
import { IExcelExporter } from '../../application/ports/IExcelExporter';
import { ActivityDomainService } from '../../domain/services/ActivityDomainService';
import ExcelJS from 'exceljs';

export class ExcelJSExporter implements IExcelExporter {
  private daySchedules: Map<string, DaySchedule> = new Map();

  setDaySchedules(schedules: Map<string, DaySchedule>): void {
    this.daySchedules = schedules;
    console.log(`📅 [ExcelExporter] Horários de ${schedules.size} dias carregados`);
  }

  async export(activities: Activity[]): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const colaborador = activities[0]?.collaborator || 'Eduardo Faller';

    // Ordenar atividades
    const sortedActivities = ActivityDomainService.sortActivities(activities, 'date', 'asc');

    // Obter mês e ano das atividades
    const primeiraData = sortedActivities[0]?.date;
    const ano = primeiraData ? primeiraData.getFullYear() : new Date().getFullYear();
    const mes = primeiraData ? primeiraData.getMonth() + 1 : new Date().getMonth() + 1;

    // Criar abas
    this.createActivitiesSheet(workbook, sortedActivities);
    const lastTimesheetRow = this.createTimesheetSheet(workbook, sortedActivities, colaborador, mes, ano);
    this.createFinancialSummarySheet(workbook, sortedActivities, colaborador, mes, ano, lastTimesheetRow);

    // Download
    await this.downloadWorkbook(workbook, mes, ano);
  }

  private createActivitiesSheet(workbook: ExcelJS.Workbook, activities: Activity[]): void {
    const ws = workbook.addWorksheet('Atividades');

    // Cabeçalho
    ws.getCell('A1').value = 'Lista de Atividades Completas';
    ws.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FF3B505A' } };
    ws.mergeCells('A1:F1');

    // Cabeçalho da tabela
    const header = ws.getRow(3);
    header.values = ['Colaborador', 'Data Início', 'Hora inicio', 'Hora fim', 'Tempo', 'Tarefa'];
    header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B505A' } };
    header.alignment = { vertical: 'middle', horizontal: 'left' };

    // Bordas no cabeçalho
    for (let col = 1; col <= 6; col++) {
      ws.getCell(3, col).border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    }

    // Adicionar dados
    activities.forEach((activity, index) => {
      const row = ws.getRow(4 + index);
      row.values = [
        activity.collaborator,
        activity.date,
        activity.startTime,
        activity.calculateEndTime(),
        activity.duration,
        activity.task
      ];

      // Bordas e zebrado
      for (let col = 1; col <= 6; col++) {
        const cell = ws.getCell(4 + index, col);
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
          left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
          bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
          right: { style: 'thin', color: { argb: 'FFD3D3D3' } }
        };

        if (index % 2 === 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF9E7' } };
        }
      }

      // Formatar data
      ws.getCell(`B${4 + index}`).numFmt = 'dd/mm/yyyy';
    });

    // Larguras
    ws.getColumn('A').width = 20;
    ws.getColumn('B').width = 15;
    ws.getColumn('C').width = 12;
    ws.getColumn('D').width = 12;
    ws.getColumn('E').width = 10;
    ws.getColumn('F').width = 60;
  }

  private createTimesheetSheet(
    workbook: ExcelJS.Workbook,
    activities: Activity[],
    colaborador: string,
    mes: number,
    ano: number
  ): number {
    const ws = workbook.addWorksheet('Lancto Horas');

    // Cabeçalhos informativos
    ws.getCell('A1').value = 'Lançamento de Horas de Serviços';
    ws.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FF3B505A' } };

    ws.getCell('A2').value = 'Periodo:';
    ws.getCell('B2').value = `${mes}/${ano}`;
    ws.getCell('A2').font = { bold: true };

    ws.getCell('A3').value = 'Profissional:';
    ws.getCell('B3').value = colaborador;
    ws.getCell('A3').font = { bold: true };

    ws.getCell('A4').value = 'Empresa:';
    ws.getCell('B4').value = colaborador;
    ws.getCell('A4').font = { bold: true };

    // Cabeçalho da tabela
    const headerRow1 = ws.getRow(6);
    headerRow1.values = ['', 'Data', 'Inicio', 'Fim', 'Total Horas', 'Local', '', 'Descrição Atividades', 'Abonar Reembolso', 'Final de Semana', 'Reembolso Km'];
    headerRow1.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B505A' } };

    const headerRow2 = ws.getRow(7);
    headerRow2.values = ['', '', '', '', '', '#ID', 'Nome', '', '', '', ''];
    headerRow2.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B505A' } };

    // Mesclar células
    ws.mergeCells('B6:B7');
    ws.mergeCells('C6:C7');
    ws.mergeCells('D6:D7');
    ws.mergeCells('E6:E7');
    ws.mergeCells('F6:G6');
    ws.mergeCells('H6:H7');
    ws.mergeCells('I6:I7');
    ws.mergeCells('J6:J7');
    ws.mergeCells('K6:K7');

    // Processar dados agrupados por dia
    const grouped = ActivityDomainService.groupByDate(activities);
    let rowIndex = 8;

    Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([dateKey, dayActivities]) => {
        const date = new Date(dateKey + 'T00:00:00');
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        // Obter horários do dia
        const daySchedule = this.daySchedules.get(dateKey);
        console.log(`\n📅 [ExcelExporter] Dia ${dateKey}: ${daySchedule ? 'Horários encontrados' : 'Sem horários'}`);
        if (daySchedule) {
          console.log(`   ⏰ Início: ${daySchedule.startTime || '-'}`);
          console.log(`   🍽️  Almoço: ${daySchedule.lunchTime || '-'}`);
          console.log(`   🔙 Retorno: ${daySchedule.returnTime || '-'}`);
          console.log(`   🏁 Final: ${daySchedule.endTime || '-'}`);
        }

        if (isWeekend || dayActivities.length === 0) {
          const row = ws.getRow(rowIndex);
          row.values = ['', date, '', '', '0:00', '', '', '', 'Não', isWeekend ? 'Sim' : 'Não', 0];
          ws.getCell(`B${rowIndex}`).numFmt = 'dd/mm/yy, ddd';
          rowIndex++;
        } else {
          // Verificar se há atividades de manhã (6h-12h) e tarde (12h-18h)
          const morningActivities = dayActivities.filter(a => {
            const [hour] = a.startTime.split(':').map(Number);
            return hour >= 6 && hour < 12;
          });

          const afternoonActivities = dayActivities.filter(a => {
            const [hour] = a.startTime.split(':').map(Number);
            return hour >= 12 && hour < 18;
          });

          console.log(`\n📊 [ExcelExporter] Processando dia ${dateKey}:`);
          console.log(`   🌅 Manhã (6h-12h): ${morningActivities.length} atividades`);
          console.log(`   🌆 Tarde (12h-18h): ${afternoonActivities.length} atividades`);

          // MANHÃ: Usar APENAS horários das etiquetas
          if (morningActivities.length > 0) {
            const row = ws.getRow(rowIndex);
            row.values = ['', date, '', '', '', '', '', '', 'Não', 'Não', 0];

            ws.getCell(`B${rowIndex}`).numFmt = 'dd/mm/yy, ddd';

            // Coluna C (Início): Usar horário de início do dia da etiqueta
            if (daySchedule?.startTime) {
              ws.getCell(`C${rowIndex}`).value = daySchedule.startTime;
              ws.getCell(`C${rowIndex}`).numFmt = 'h:mm';
              console.log(`   ⏰ Manhã Início: ${daySchedule.startTime}`);
            } else {
              console.log(`   ⏰ Manhã Início: Sem etiqueta, deixando vazio`);
            }

            // Coluna D (Fim): Usar horário de almoço da etiqueta
            if (daySchedule?.lunchTime) {
              ws.getCell(`D${rowIndex}`).value = daySchedule.lunchTime;
              ws.getCell(`D${rowIndex}`).numFmt = 'h:mm';
              console.log(`   🍽️  Manhã Fim: ${daySchedule.lunchTime}`);
            } else {
              console.log(`   🍽️  Manhã Fim: Sem etiqueta, deixando vazio`);
            }

            // Total de horas (só se tiver ambos os horários)
            if (daySchedule?.startTime && daySchedule?.lunchTime) {
              ws.getCell(`E${rowIndex}`).value = { formula: `D${rowIndex}-C${rowIndex}` };
              ws.getCell(`E${rowIndex}`).numFmt = 'h:mm';
            }

            console.log(`   ✅ Manhã: Linha ${rowIndex} configurada`);
            rowIndex++;
          }

          // TARDE: Usar APENAS horários das etiquetas
          if (afternoonActivities.length > 0) {
            const row = ws.getRow(rowIndex);
            row.values = ['', date, '', '', '', '', '', '', 'Não', 'Não', 0];

            ws.getCell(`B${rowIndex}`).numFmt = 'dd/mm/yy, ddd';

            // Coluna C (Início): Usar horário de retorno do almoço da etiqueta
            if (daySchedule?.returnTime) {
              ws.getCell(`C${rowIndex}`).value = daySchedule.returnTime;
              ws.getCell(`C${rowIndex}`).numFmt = 'h:mm';
              console.log(`   🔙 Tarde Início: ${daySchedule.returnTime}`);
            } else {
              console.log(`   🔙 Tarde Início: Sem etiqueta, deixando vazio`);
            }

            // Coluna D (Fim): Usar horário final da etiqueta
            if (daySchedule?.endTime) {
              ws.getCell(`D${rowIndex}`).value = daySchedule.endTime;
              ws.getCell(`D${rowIndex}`).numFmt = 'h:mm';
              console.log(`   🏁 Tarde Fim: ${daySchedule.endTime}`);
            } else {
              console.log(`   🏁 Tarde Fim: Sem etiqueta, deixando vazio`);
            }

            // Total de horas (só se tiver ambos os horários)
            if (daySchedule?.returnTime && daySchedule?.endTime) {
              ws.getCell(`E${rowIndex}`).value = { formula: `D${rowIndex}-C${rowIndex}` };
              ws.getCell(`E${rowIndex}`).numFmt = 'h:mm';
            }

            console.log(`   ✅ Tarde: Linha ${rowIndex} configurada`);
            rowIndex++;
          }
        }
      });

    // Larguras
    ws.getColumn('B').width = 18;
    ws.getColumn('C').width = 10;
    ws.getColumn('D').width = 10;
    ws.getColumn('E').width = 12;
    ws.getColumn('F').width = 8;
    ws.getColumn('G').width = 20;
    ws.getColumn('H').width = 30;
    ws.getColumn('I').width = 18;
    ws.getColumn('J').width = 16;
    ws.getColumn('K').width = 15;

    // Retornar a última linha usada (rowIndex - 1 porque rowIndex já foi incrementado)
    return rowIndex - 1;
  }

  private createFinancialSummarySheet(
    workbook: ExcelJS.Workbook,
    _activities: Activity[],
    colaborador: string,
    mes: number,
    ano: number,
    lastTimesheetRow: number
  ): void {
    const ws = workbook.addWorksheet('Resumo Financeiro');

    ws.getCell('A1').value = 'Resumo Financeiro Pagamento Serviços';
    ws.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FF3B505A' } };

    ws.getCell('A2').value = 'Periodo:';
    ws.getCell('B2').value = `${mes}/${ano}`;
    ws.getCell('A2').font = { bold: true };

    ws.getCell('A3').value = 'Profissional:';
    ws.getCell('B3').value = colaborador;
    ws.getCell('A3').font = { bold: true };

    ws.getCell('A4').value = 'Empresa:';
    ws.getCell('B4').value = colaborador;
    ws.getCell('A4').font = { bold: true };

    ws.getCell('B9').value = 'Pagamento Horas Serviço';
    ws.getCell('B9').font = { bold: true, size: 12 };

    ws.getCell('B10').value = 'Valor/Hora do Contrato';
    ws.getCell('C10').value = 0;
    ws.getCell('C10').numFmt = 'R$ #,##0.00';
    ws.getCell('B10').font = { bold: true };

    ws.getCell('B11').value = 'Qtd Total Horas/Homem';
    // Fórmula: =ARRED(SOMA($'Lancto Horas'.E8:E[lastRow])*24,2)
    ws.getCell('C11').value = {
      formula: `ROUND(SUM('Lancto Horas'!E8:E${lastTimesheetRow})*24,2)`
    };
    ws.getCell('C11').numFmt = '#,##0.00';
    ws.getCell('B11').font = { bold: true };

    console.log(`💰 [Resumo Financeiro] Fórmula de horas: ROUND(SUM('Lancto Horas'!E8:E${lastTimesheetRow})*24,2)`);

    ws.getCell('B12').value = 'Vlr Total Horas/Homem';
    ws.getCell('C12').value = { formula: 'C11*C10' };
    ws.getCell('C12').numFmt = 'R$ #,##0.00';
    ws.getCell('B12').font = { bold: true };

    // Estilização
    ws.getCell('C10').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF9E7' } };
    ws.getCell('C11').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF9E7' } };
    ws.getCell('C12').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4B942' } };
    ws.getCell('C12').font = { bold: true };

    ws.getColumn('B').width = 30;
    ws.getColumn('C').width = 20;
  }

  private async downloadWorkbook(workbook: ExcelJS.Workbook, mes: number, ano: number): Promise<void> {
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);

    const mesNome = new Date(ano, mes - 1).toLocaleDateString('pt-BR', { month: 'long' });
    link.download = `lancamento-${mesNome}-${ano}.xlsx`;
    link.click();
  }
}
