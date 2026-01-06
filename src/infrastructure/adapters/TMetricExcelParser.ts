import { Activity } from '../../domain/entities/Activity';
import { DaySchedule } from '../../domain/value-objects/DaySchedule';
import { IExcelParser } from '../../application/ports/IExcelParser';
import Papa from 'papaparse';

interface RawActivity {
  data: string;
  inicio: string;
  duracao: string;
  tarefa: string;
  validationWarnings?: string[];
}

// Adapter para parser de Excel/CSV do TMetric
export class TMetricExcelParser implements IExcelParser {
  // Armazena os horários de cada dia processado
  private daySchedules: Map<string, DaySchedule> = new Map();

  // Método para obter os horários dos dias processados
  getDaySchedules(): Map<string, DaySchedule> {
    return this.daySchedules;
  }

  async parse(file: File, collaborator: string): Promise<Activity[]> {
    console.log('\n🔍 [Excel Parser] Iniciando processamento do arquivo:', file.name);
    console.log('📋 [Excel Parser] Colaborador:', collaborator);

    // NÃO limpar horários anteriores - acumular de múltiplos CSVs
    // this.daySchedules.clear(); ← REMOVIDO para permitir importação de múltiplos CSVs
    console.log(`📅 [Excel Parser] Horários já armazenados: ${this.daySchedules.size} dias`);

    const fileContent = await file.text();
    console.log('📄 [Excel Parser] Conteúdo do arquivo lido, tamanho:', fileContent.length, 'caracteres');

    const resultado = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false
    });

    const dados = resultado.data as any[];
    console.log(`\n📊 [Excel Parser] Dados parseados: ${dados.length} linhas`);
    console.log('=== PREVIEW DOS DADOS DO CSV ===');
    console.log('Primeiras 3 linhas:', dados.slice(0, 3));
    console.log('=== FIM DO PREVIEW ===\n');

    if (dados.length > 0) {
      console.log('📋 [Excel Parser] Colunas disponíveis:', Object.keys(dados[0]));
    }

    const rawActivities = this.extractActivitiesFromData(dados);
    console.log(`\n📊 [Excel Parser] Total de atividades brutas extraídas: ${rawActivities.length}`);

    const activities = rawActivities.map((raw, index) => {
      console.log(`\n🔄 [Excel Parser] Convertendo atividade ${index + 1}/${rawActivities.length}:`);
      console.log(`   📅 Data: ${raw.data}`);
      console.log(`   ⏰ Início: ${raw.inicio}`);
      console.log(`   ⏱️  Duração: ${raw.duracao}`);
      console.log(`   📝 Tarefa: ${raw.tarefa}`);
      if (raw.validationWarnings && raw.validationWarnings.length > 0) {
        console.log(`   ⚠️  Avisos: ${raw.validationWarnings.join('; ')}`);
      }

      const activity = Activity.create({
        date: new Date(raw.data + 'T00:00:00'),
        startTime: raw.inicio,
        duration: raw.duracao,
        task: raw.tarefa,
        collaborator,
        validationWarnings: raw.validationWarnings,
        hasValidationIssues: raw.validationWarnings && raw.validationWarnings.length > 0
      });

      console.log(`   ✅ Activity criada com ID: ${activity.id}`);
      return activity;
    });

    console.log(`\n✨ [Excel Parser] Processamento concluído: ${activities.length} atividades criadas\n`);
    return activities;
  }

  private extractActivitiesFromData(dados: any[]): RawActivity[] {
    console.log('\n🔍 [extractActivitiesFromData] Iniciando extração de atividades dos dados...');
    const activities: RawActivity[] = [];

    // Encontrar colunas de datas (formato YYYY-MM-DD)
    console.log('📅 [extractActivitiesFromData] Buscando colunas de data...');
    const colunasData = Object.keys(dados[0] || {}).filter(col =>
      /^\d{4}-\d{2}-\d{2}$/.test(col)
    );

    console.log(`✅ [extractActivitiesFromData] ${colunasData.length} colunas de data encontradas:`, colunasData);

    // Processar cada dia
    for (const data of colunasData) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📆 Processando dia: ${data}`);
      console.log(`${'='.repeat(60)}`);

      const diaDoMes = data.split('-')[2];
      console.log(`📍 Dia do mês extraído: ${diaDoMes}`);

      // Primeira passagem: coletar etiquetas de início, almoço, retorno e final
      console.log('\n🔍 [Primeira Passagem] Buscando etiquetas de horários do dia...');
      let horaInicioDia = '8:00';
      let horaAlmoco: string | null = null;
      let horaRetornoAlmoco: string | null = null;
      let horaFinal: string | null = null;

      for (const linha of dados) {
        // BUGFIX: Verificar etiquetas em TODAS as linhas, independente de ter duração no dia
        // A etiqueta pode estar em uma linha que tem atividade em outro dia
        const etiqueta = (linha['Etiquetas'] || '').toLowerCase();

        // Se não há etiqueta nesta linha, pular
        if (!etiqueta || etiqueta.trim() === '') continue;

        console.log(`   🏷️  Verificando etiqueta: "${etiqueta}"`);

        // Verificar se a etiqueta pertence a este dia (olhando a data da tarefa)
        // IMPORTANTE: Só valida se a tarefa tiver o padrão DD - NN - Descrição ou DD-NN-Descrição
        // Aceita com ou sem espaços: "24 - 01 - Descrição" ou "24-01-Descrição"
        const tarefa = linha['Entrada de tempo'] || '';
        const matchDiaTarefa = tarefa.match(/^(\d{1,2})\s*-\s*\d{1,2}\s*-/);

        if (matchDiaTarefa) {
          // Se tem o padrão, verificar se é do dia correto
          const diaTarefa = matchDiaTarefa[1].padStart(2, '0');
          if (diaTarefa !== diaDoMes) {
            console.log(`   ⏭️  Pulando: etiqueta do dia ${diaTarefa}, processando dia ${diaDoMes}`);
            continue;
          }
          console.log(`   ✅ Etiqueta do dia ${diaTarefa} aceita (corresponde ao dia ${diaDoMes})`);
        } else {
          // Se NÃO tem o padrão DD - NN -, aceitar a etiqueta (pode ser linha sem tarefa específica)
          console.log(`   ℹ️  Linha sem padrão de data, aceitando etiqueta: "${etiqueta}"`);
        }

        // Padrões flexíveis: "inicio 8:30", "inicio: 8:30", "inicio:8:30", "inicio 8h30", etc
        const matchInicio = etiqueta.match(/inicio[:\s]*(\d{1,2})[:\sh]*(\d{2})/i);
        if (matchInicio) {
          horaInicioDia = `${matchInicio[1]}:${matchInicio[2]}`;
          console.log(`   ✅ Hora de início encontrada: ${horaInicioDia} (de etiqueta: "${etiqueta}")`);
        }

        // Padrões flexíveis: "almoco 12:00", "almoço: 12:00", "almoco:12:00", "almoço 12h00", etc
        const matchAlmoco = etiqueta.match(/(almo[cç]o)[:\s]*(\d{1,2})[:\sh]*(\d{2})/i);
        if (matchAlmoco) {
          horaAlmoco = `${matchAlmoco[2]}:${matchAlmoco[3]}`;
          console.log(`   ✅ Hora de almoço encontrada: ${horaAlmoco} (de etiqueta: "${etiqueta}")`);
        }

        // Padrões flexíveis: "retorno almoco 13:30", "retorno 13:30", "volta 13:30", "retorno do almoco 13:30", etc
        const matchRetorno = etiqueta.match(/(?:retorno|volta)(?:\s+(?:do\s+)?(?:almo[cç]o))?\s*[:\s]*(\d{1,2})[:\sh]*(\d{2})/i);
        if (matchRetorno) {
          horaRetornoAlmoco = `${matchRetorno[1]}:${matchRetorno[2]}`;
          console.log(`   ✅ Hora de retorno do almoço encontrada: ${horaRetornoAlmoco} (de etiqueta: "${etiqueta}")`);
        }

        // Padrões flexíveis: "final 18:00", "fim 18:00", "saida 18:00", "final de expediente 18:00", etc
        const matchFinal = etiqueta.match(/(?:final|fim|saida|sa[ií]da)(?:\s+(?:de\s+)?expediente)?\s*[:\s]*(\d{1,2})[:\sh]*(\d{2})/i);
        if (matchFinal) {
          horaFinal = `${matchFinal[1]}:${matchFinal[2]}`;
          console.log(`   ✅ Hora final encontrada: ${horaFinal} (de etiqueta: "${etiqueta}")`);
        }
      }

      console.log(`\n⚙️ Configurações do dia:`);
      console.log(`   ⏰ Hora de início: ${horaInicioDia}`);
      console.log(`   🍽️  Hora de almoço: ${horaAlmoco || 'Não definida'}`);
      console.log(`   🔙 Hora de retorno: ${horaRetornoAlmoco || 'Não definida'}`);
      console.log(`   🏁 Hora final: ${horaFinal || 'Não definida'}`);

      // Armazenar horários do dia
      const daySchedule = DaySchedule.create({
        date: data,
        startTime: horaInicioDia,
        lunchTime: horaAlmoco,
        returnTime: horaRetornoAlmoco,
        endTime: horaFinal
      });
      this.daySchedules.set(data, daySchedule);
      console.log(`   💾 Horários do dia armazenados para ${data}`);

      let horaAtual = horaInicioDia;
      let jaPassouAlmoco = false;

      // Segunda passagem: processar atividades
      console.log(`\n🔄 [Segunda Passagem] Processando atividades do dia ${data}...`);
      let atividadeNumero = 0;

      for (const linha of dados) {
        const tarefa = linha['Entrada de tempo'];
        const duracao = linha[data];
        const etiqueta = (linha['Etiquetas'] || '').toLowerCase();

        console.log(`\n   📋 Linha: Tarefa="${tarefa}", Duração="${duracao}", Etiqueta="${etiqueta}"`);

        if (!duracao || duracao.trim() === '' || duracao === '-') {
          console.log(`   ⏭️  Pulando: sem duração para este dia`);
          continue;
        }

        const temFormatoValido = tarefa.match(/^(\d{1,2})\s*-\s*(\d{1,2})\s*-\s*.+/);

        if ((etiqueta.includes('inicio') || etiqueta.includes('almoço') || etiqueta.includes('almoco') || etiqueta.includes('retorno') || etiqueta.includes('volta') || etiqueta.includes('final') || etiqueta.includes('fim') || etiqueta.includes('saida') || etiqueta.includes('saída')) && !temFormatoValido) {
          console.log(`   ⚠️ Pulando linha de etiqueta sem tarefa válida: "${tarefa}"`);
          continue;
        }

        const matchTarefa = tarefa.match(/^(\d{1,2})\s*-\s*(\d{1,2})\s*-\s*(.+)/);

        if (matchTarefa) {
          const diaTarefa = matchTarefa[1].padStart(2, '0');
          console.log(`   🔍 Match da tarefa encontrado: Dia=${matchTarefa[1]}, Seq=${matchTarefa[2]}, Desc="${matchTarefa[3]}"`);

          if (diaTarefa !== diaDoMes) {
            console.log(`   ⚠️ Pulando tarefa "${tarefa}" - dia da tarefa ${diaTarefa} ≠ dia da coluna ${diaDoMes}`);
            continue;
          }

          console.log(`   ✅ Tarefa válida: dia ${diaTarefa} corresponde ao dia da coluna ${diaDoMes}`);
        } else {
          console.log(`   ⚠️ Tarefa não segue o padrão DD - NN - Descrição`);
        }

        console.log(`   📊 Duração original: "${duracao}"`);
        let duracaoFormatada = this.normalizeDuration(duracao.trim());
        console.log(`   ✅ Duração normalizada: "${duracaoFormatada}"`);

        // Array para coletar avisos de validação desta atividade
        const avisos: string[] = [];

        // Verificar se tem etiqueta de horário específico (inicio ou retorno)
        let horaInicio = horaAtual;  // Padrão: usar horário sequencial

        // Verificar etiqueta de INICIO
        const matchInicioEtiqueta = etiqueta.match(/(?:inicio|in[ií]cio)[:\s]*(\d{1,2})[:\sh]*(\d{2})/i);
        if (matchInicioEtiqueta) {
          const horaEtiqueta = `${matchInicioEtiqueta[1]}:${matchInicioEtiqueta[2]}`;
          console.log(`   🏷️  Etiqueta de INÍCIO encontrada: ${horaEtiqueta} - usando como hora inicial desta atividade`);
          horaInicio = horaEtiqueta;
          horaAtual = horaEtiqueta;  // Resetar hora atual para sincronizar
        }

        // Verificar etiqueta de RETORNO
        const matchRetornoEtiqueta = etiqueta.match(/(?:retorno|volta)(?:\s+(?:do\s+)?(?:almo[cç]o))?\s*[:\s]*(\d{1,2})[:\sh]*(\d{2})/i);
        if (matchRetornoEtiqueta) {
          const horaEtiqueta = `${matchRetornoEtiqueta[1]}:${matchRetornoEtiqueta[2]}`;
          console.log(`   🏷️  Etiqueta de RETORNO encontrada: ${horaEtiqueta} - usando como hora inicial desta atividade`);

          // Validar consistência com horário de almoço
          if (horaAlmoco) {
            const almocoMinutos = this.timeToMinutes(horaAlmoco);
            const retornoMinutos = this.timeToMinutes(horaEtiqueta);
            const diferencaMinutos = retornoMinutos - almocoMinutos;

            if (diferencaMinutos < 45 || diferencaMinutos > 90) {
              const aviso = `Horário de retorno (${horaEtiqueta}) está ${diferencaMinutos} minutos após o almoço (${horaAlmoco}). Esperado: ~60 minutos`;
              avisos.push(aviso);
              console.log(`   ⚠️  AVISO: ${aviso}`);
            } else {
              console.log(`   ✅ Horário de retorno consistente: ${diferencaMinutos} minutos após o almoço`);
            }
          }

          horaInicio = horaEtiqueta;
          horaAtual = horaEtiqueta;  // Resetar hora atual para sincronizar
          jaPassouAlmoco = true;  // Marcar que já passou do almoço
        }

        // Verificar etiqueta de ALMOÇO (atividade deve TERMINAR no horário do almoço)
        const matchAlmocoEtiqueta = etiqueta.match(/(almo[cç]o)[:\s]*(\d{1,2})[:\sh]*(\d{2})/i);
        if (matchAlmocoEtiqueta && !matchRetornoEtiqueta) {  // Não processar se já tem etiqueta de retorno
          const horaEtiqueta = `${matchAlmocoEtiqueta[2]}:${matchAlmocoEtiqueta[3]}`;
          console.log(`   🏷️  Etiqueta de ALMOÇO encontrada: ${horaEtiqueta} - ajustando atividade para terminar neste horário`);

          const almocoMinutos = this.timeToMinutes(horaEtiqueta);
          const duracaoMinutos = this.timeToMinutes(duracaoFormatada);
          const inicioCalculadoMinutos = almocoMinutos - duracaoMinutos;
          const horaAtualMinutos = this.timeToMinutes(horaAtual);

          if (inicioCalculadoMinutos >= horaAtualMinutos) {
            // Pode começar antes do almoço e terminar exatamente no horário
            horaInicio = this.minutesToTime(inicioCalculadoMinutos);
            horaAtual = horaInicio;
            console.log(`   ✅ Ajustado: Início=${horaInicio}, terminará às ${horaEtiqueta}`);
          } else {
            // Hora atual já passou do início calculado, ajustar duração
            horaInicio = horaAtual;
            const novaDuracaoMinutos = almocoMinutos - horaAtualMinutos;
            if (novaDuracaoMinutos > 0) {
              const duracaoOriginal = duracaoFormatada;
              duracaoFormatada = this.minutesToTime(novaDuracaoMinutos);
              const aviso = `Duração ajustada de ${duracaoOriginal} para ${duracaoFormatada} para terminar no horário de almoço (${horaEtiqueta})`;
              avisos.push(aviso);
              console.log(`   ⚠️  AVISO: ${aviso}`);
            } else {
              const aviso = `ERRO: Não é possível terminar às ${horaEtiqueta} - hora atual já passou (${horaAtual})`;
              avisos.push(aviso);
              console.log(`   ⚠️  ${aviso}`);
            }
          }
        }

        // Verificar etiqueta de FINAL (atividade deve TERMINAR no horário final)
        const matchFinalEtiqueta = etiqueta.match(/(?:final|fim|saida|sa[ií]da)(?:\s+(?:de\s+)?expediente)?\s*[:\s]*(\d{1,2})[:\sh]*(\d{2})/i);
        if (matchFinalEtiqueta) {
          const horaEtiqueta = `${matchFinalEtiqueta[1]}:${matchFinalEtiqueta[2]}`;
          console.log(`   🏷️  Etiqueta de FINAL encontrada: ${horaEtiqueta} - ajustando atividade para terminar neste horário`);

          const finalMinutos = this.timeToMinutes(horaEtiqueta);
          const duracaoMinutos = this.timeToMinutes(duracaoFormatada);
          const inicioCalculadoMinutos = finalMinutos - duracaoMinutos;
          const horaAtualMinutos = this.timeToMinutes(horaAtual);

          if (inicioCalculadoMinutos >= horaAtualMinutos) {
            // Pode começar e terminar exatamente no horário final
            horaInicio = this.minutesToTime(inicioCalculadoMinutos);
            horaAtual = horaInicio;
            console.log(`   ✅ Ajustado: Início=${horaInicio}, terminará às ${horaEtiqueta}`);
          } else {
            // Hora atual já passou do início calculado, ajustar duração
            horaInicio = horaAtual;
            const novaDuracaoMinutos = finalMinutos - horaAtualMinutos;
            if (novaDuracaoMinutos > 0) {
              const duracaoOriginal = duracaoFormatada;
              duracaoFormatada = this.minutesToTime(novaDuracaoMinutos);
              const aviso = `Duração ajustada de ${duracaoOriginal} para ${duracaoFormatada} para terminar no horário final (${horaEtiqueta})`;
              avisos.push(aviso);
              console.log(`   ⚠️  AVISO: ${aviso}`);
            } else {
              const aviso = `ERRO: Não é possível terminar às ${horaEtiqueta} - hora atual já passou (${horaAtual})`;
              avisos.push(aviso);
              console.log(`   ⚠️  ${aviso}`);
            }
          }
        }

        const horaFim = this.calculateEndTime(horaInicio, duracaoFormatada);
        console.log(`   ⏰ Hora calculada: Início=${horaInicio}, Fim=${horaFim}`);

        // Verificar se chegamos no horário de almoço
        if (horaAlmoco && !jaPassouAlmoco) {
          console.log(`   🍽️  Verificando almoço: hora atual=${horaAtual}, almoço=${horaAlmoco}`);
          const fimMinutos = this.timeToMinutes(horaFim);
          const almocoMinutos = this.timeToMinutes(horaAlmoco);
          console.log(`   📊 Minutos: fim=${fimMinutos}, almoço=${almocoMinutos}`);

          if (fimMinutos >= almocoMinutos) {
            console.log(`   ⚠️ Atividade cruza com horário de almoço!`);
            const inicioMinutos = this.timeToMinutes(horaInicio);
            const duracaoAteAlmoco = almocoMinutos - inicioMinutos;
            console.log(`   📊 Duração até almoço: ${duracaoAteAlmoco} minutos`);

            if (duracaoAteAlmoco > 0) {
              const duracaoAjustada = this.minutesToTime(duracaoAteAlmoco);
              atividadeNumero++;

              console.log(`   ✅ [Atividade ${atividadeNumero}] AJUSTADA PARA ALMOÇO`);
              console.log(`      Início: ${horaInicio} | Fim: ${horaAlmoco} (ajustado) | Duração: ${duracaoAjustada}`);
              console.log(`      Tarefa: ${tarefa}`);

              // Adicionar aviso sobre ajuste para almoço
              const avisosAjuste = [...avisos];
              const duracaoOriginal = duracaoFormatada;
              if (duracaoOriginal !== duracaoAjustada) {
                avisosAjuste.push(`Duração ajustada de ${duracaoOriginal} para ${duracaoAjustada} devido ao horário de almoço (${horaAlmoco})`);
              }

              activities.push({
                data: data,
                inicio: horaInicio,
                duracao: duracaoAjustada,
                tarefa: tarefa || 'Sem descrição',
                validationWarnings: avisosAjuste.length > 0 ? avisosAjuste : undefined
              });

              // Se temos horário de retorno definido, usar ele. Caso contrário, 1h após o almoço
              if (horaRetornoAlmoco) {
                horaAtual = horaRetornoAlmoco;
                console.log(`   🍽️  Pausa para almoço (${horaAlmoco} - ${horaRetornoAlmoco})`);
              } else {
                horaAtual = this.minutesToTime(almocoMinutos + 60);
                console.log(`   🍽️  Pausa para almoço de 1h (${horaAlmoco} - ${horaAtual})`);
              }
              jaPassouAlmoco = true;
              console.log(`   ⏩ Próxima atividade começa às ${horaAtual}`);
            } else {
              console.log(`   ⚠️ Duração até almoço <= 0, pulando para depois do almoço`);
              // Se temos horário de retorno definido, usar ele. Caso contrário, 1h após o almoço
              horaAtual = horaRetornoAlmoco || this.minutesToTime(almocoMinutos + 60);
              jaPassouAlmoco = true;
            }

            continue;
          }
        }

        atividadeNumero++;
        console.log(`   ✅ [Atividade ${atividadeNumero}] ADICIONADA`);
        console.log(`      Início: ${horaInicio} | Fim: ${horaFim} | Duração: ${duracaoFormatada}`);
        console.log(`      Tarefa: ${tarefa}`);

        activities.push({
          data: data,
          inicio: horaInicio,
          duracao: duracaoFormatada,
          tarefa: tarefa || 'Sem descrição',
          validationWarnings: avisos.length > 0 ? avisos : undefined
        });

        horaAtual = horaFim;
        console.log(`   ⏩ Próxima atividade começará às ${horaAtual}`);
      }
    }

    // Ordenar por data e hora
    activities.sort((a, b) => {
      if (a.data !== b.data) return a.data.localeCompare(b.data);
      return a.inicio.localeCompare(b.inicio);
    });

    return activities;
  }

  private normalizeDuration(duracao: string): string {
    // Formato HH:MM:SS -> H:MM
    if (duracao.match(/^\d{2}:\d{2}:\d{2}$/)) {
      const [h, m] = duracao.split(':');
      const horas = parseInt(h);
      const minutos = parseInt(m);
      return `${horas}:${minutos.toString().padStart(2, '0')}`;
    }

    // Formato decimal (0.5, 1.25)
    if (duracao.includes('.') || duracao.includes(',')) {
      const horas = parseFloat(duracao.replace(',', '.'));
      const horasInt = Math.floor(horas);
      const minutos = Math.round((horas - horasInt) * 60);
      return `${horasInt}:${minutos.toString().padStart(2, '0')}`;
    }

    // Se não tem formato correto
    if (!duracao.includes(':')) {
      const horas = parseFloat(duracao);
      const horasInt = Math.floor(horas);
      const minutos = Math.round((horas - horasInt) * 60);
      return `${horasInt}:${minutos.toString().padStart(2, '0')}`;
    }

    return duracao;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}:${m.toString().padStart(2, '0')}`;
  }

  private calculateEndTime(startTime: string, duration: string): string {
    const startMinutes = this.timeToMinutes(startTime);
    const durationMinutes = this.timeToMinutes(duration);
    const endMinutes = startMinutes + durationMinutes;
    return this.minutesToTime(endMinutes);
  }
}
