import { Activity } from '../../domain/entities/Activity';
import { IPDFParser } from '../../application/ports/IPDFParser';
import { extractTextFromPDF } from '../../utils/pdf-config';

interface RawActivity {
  data: string;
  inicio: string;
  duracao: string;
  tarefa: string;
}

// Adapter para parser de PDF do TMetric
export class TMetricPDFParser implements IPDFParser {
  async parse(file: File, collaborator: string): Promise<Activity[]> {
    console.log('🔍 [PDF Parser] Iniciando processamento do arquivo:', file.name);
    console.log('📋 [PDF Parser] Colaborador:', collaborator);

    const content = await extractTextFromPDF(file);
    console.log('=== CONTEÚDO EXTRAÍDO DO PDF ===');
    console.log(content);
    console.log('=== FIM DO CONTEÚDO ===\n');

    const rawActivities = this.extractActivitiesFromText(content);
    console.log(`\n📊 [PDF Parser] Total de atividades brutas extraídas: ${rawActivities.length}`);

    const activities = rawActivities.map((raw, index) => {
      console.log(`\n🔄 [PDF Parser] Convertendo atividade ${index + 1}/${rawActivities.length}:`);
      console.log(`   📅 Data: ${raw.data}`);
      console.log(`   ⏰ Início: ${raw.inicio}`);
      console.log(`   ⏱️  Duração: ${raw.duracao}`);
      console.log(`   📝 Tarefa: ${raw.tarefa}`);

      const activity = Activity.create({
        date: new Date(raw.data + 'T00:00:00'),
        startTime: raw.inicio,
        duration: raw.duracao,
        task: raw.tarefa,
        collaborator
      });

      console.log(`   ✅ Activity criada com ID: ${activity.id}`);
      return activity;
    });

    console.log(`\n✨ [PDF Parser] Processamento concluído: ${activities.length} atividades criadas\n`);
    return activities;
  }

  private extractActivitiesFromText(content: string): RawActivity[] {
    console.log('\n🔍 [extractActivitiesFromText] Iniciando extração de atividades...');
    const activities: RawActivity[] = [];

    // Encontrar período
    const periodoMatch = content.match(/Período:\s*(\d+)\s+(\w+)\.\s+(\d+)/);
    let mesAtual = 9;
    let anoAtual = 2025;

    console.log('📆 [extractActivitiesFromText] Buscando período no conteúdo...');
    if (periodoMatch) {
      console.log('   ✅ Período encontrado:', periodoMatch[0]);
      const meses: { [key: string]: number } = {
        'jan': 1, 'fev': 2, 'mar': 3, 'abr': 4, 'mai': 5, 'jun': 6,
        'jul': 7, 'ago': 8, 'set': 9, 'out': 10, 'nov': 11, 'dez': 12
      };
      mesAtual = meses[periodoMatch[2].toLowerCase().substring(0, 3)] || 9;
      anoAtual = parseInt(periodoMatch[3]);
      console.log(`   📅 Período extraído: Mês ${mesAtual}, Ano ${anoAtual}`);
    } else {
      console.log('   ⚠️ Período não encontrado, usando padrão: Mês 9, Ano 2025');
    }

    // Padrão para capturar atividades: DD - ORDEM - Descrição Não/Sim Projeto H:MM
    const regexAtividade = /(\d{2})\s*-\s*(\d{2})\s*-\s*(.+?)\s+(Não|Sim)\s+(.+?)\s+(\d+:\d+)/g;
    console.log('🔎 [extractActivitiesFromText] Padrão regex:', regexAtividade);

    const atividadesPorDia: { [key: string]: string } = {};
    let totalEncontradas = 0;

    // Usar matchAll para pegar TODAS as ocorrências
    console.log('🔄 [extractActivitiesFromText] Executando regex no conteúdo...');
    const matches = content.matchAll(regexAtividade);

    for (const match of matches) {
      const dia = match[1];
      const sequencia = match[2];
      const descricao = match[3];
      const duracao = match[6];

      totalEncontradas++;
      console.log(`\n✅ [Match ${totalEncontradas}] Atividade encontrada:`);
      console.log(`   📍 Dia: ${dia}`);
      console.log(`   🔢 Sequência: ${sequencia}`);
      console.log(`   📝 Descrição: "${descricao}"`);
      console.log(`   ⏱️  Duração: ${duracao}`);

      // Garantir formato com 2 dígitos
      const diaFormatado = dia.padStart(2, '0');
      const sequenciaFormatada = sequencia.padStart(2, '0');

      // Limpar descrição removendo espaços extras
      const descricaoLimpa = descricao
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/\s*-\s*$/, '');

      // Criar tarefa no formato: DD - DD - Descrição
      const tarefaFormatada = `${diaFormatado} - ${sequenciaFormatada} - ${descricaoLimpa}`;

      const data = `${anoAtual}-${mesAtual.toString().padStart(2, '0')}-${diaFormatado}`;

      // Inicializar hora do dia (PDF não possui etiquetas de início como CSV)
      if (!atividadesPorDia[data]) {
        atividadesPorDia[data] = '8:00';
        console.log(`   ⏰ [PDF] Dia ${diaFormatado}: Usando horário padrão de início: 8:00`);
        console.log(`   ℹ️  [PDF] IMPORTANTE: PDFs não possuem etiquetas 'inicio:' - Use CSV/Excel para controle personalizado`);
      }

      const horaInicio = atividadesPorDia[data];
      console.log(`   📍 Tarefa será alocada começando às: ${horaInicio}`);

      activities.push({
        data,
        inicio: horaInicio,
        duracao: duracao.trim(),
        tarefa: tarefaFormatada
      });

      // Atualizar hora acumulada do dia
      atividadesPorDia[data] = this.calculateEndTime(horaInicio, duracao.trim());

      console.log(`✓ ${totalEncontradas}. [${tarefaFormatada}] | Duração: ${duracao}`);
    }

    console.log(`\nTotal de atividades encontradas: ${totalEncontradas}`);

    // Método alternativo caso o regex principal não encontre nada
    if (totalEncontradas === 0) {
      console.log('Tentando método alternativo linha por linha...');
      return this.extractActivitiesLineByLine(content, anoAtual, mesAtual, atividadesPorDia);
    }

    // Ordenar por data e hora
    activities.sort((a, b) => {
      if (a.data !== b.data) return a.data.localeCompare(b.data);
      return a.inicio.localeCompare(b.inicio);
    });

    return activities;
  }

  private extractActivitiesLineByLine(
    content: string,
    anoAtual: number,
    mesAtual: number,
    atividadesPorDia: { [key: string]: string }
  ): RawActivity[] {
    const activities: RawActivity[] = [];
    const linhas = content.split('\n');
    let totalEncontradas = 0;

    for (const linha of linhas) {
      const matchLinha = linha.match(/^(\d{1,2})\s*-\s*(\d{1,2})\s*-\s*(.+)/);

      if (matchLinha) {
        const [, dia, sequencia, resto] = matchLinha;
        const tempoMatch = resto.match(/(\d+:\d+)(?:\s|$)/);

        if (tempoMatch) {
          const duracao = tempoMatch[1];

          let descricao = resto
            .replace(/\s+(Não|Sim)\s+.+?\s+\d+:\d+.*$/, '')
            .trim()
            .replace(/\s+/g, ' ');

          const diaFormatado = dia.padStart(2, '0');
          const sequenciaFormatada = sequencia.padStart(2, '0');
          const tarefaFormatada = `${diaFormatado} - ${sequenciaFormatada} - ${descricao}`;

          const data = `${anoAtual}-${mesAtual.toString().padStart(2, '0')}-${diaFormatado}`;

          if (!atividadesPorDia[data]) {
            atividadesPorDia[data] = '8:00';
          }

          const horaInicio = atividadesPorDia[data];

          activities.push({
            data,
            inicio: horaInicio,
            duracao: duracao,
            tarefa: tarefaFormatada
          });

          atividadesPorDia[data] = this.calculateEndTime(horaInicio, duracao);

          totalEncontradas++;
          console.log(`✓ ALT ${totalEncontradas}. [${tarefaFormatada}] | Duração: ${duracao}`);
        }
      }
    }

    return activities;
  }

  private calculateEndTime(startTime: string, duration: string): string {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [durationHours, durationMinutes] = duration.split(':').map(Number);

    const totalMinutes = (startHours * 60 + startMinutes) + (durationHours * 60 + durationMinutes);
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;

    return `${endHours}:${endMinutes.toString().padStart(2, '0')}`;
  }
}
