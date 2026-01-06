# 📋 Logs Implementados - Sistema de Rastreamento

Este documento descreve todos os logs implementados no sistema para rastrear como os valores dos campos são capturados e processados.

## 🎯 Objetivo

Adicionar logs detalhados em todo o fluxo de processamento de arquivos (PDF e Excel/CSV) para facilitar o debugging e entender exatamente como os valores estão sendo extraídos dos arquivos.

---

## 📄 1. TMetricPDFParser (`src/infrastructure/adapters/TMetricPDFParser.ts`)

### Logs no método `parse()`

- **Início do processamento**: Nome do arquivo e colaborador
- **Conteúdo extraído**: Todo o texto extraído do PDF
- **Total de atividades brutas**: Quantidade de atividades extraídas
- **Conversão de cada atividade**: Para cada atividade:
  - Data, hora de início, duração e descrição da tarefa
  - ID da Activity criada

### Logs no método `extractActivitiesFromText()`

- **Busca de período**: Informa se o período foi encontrado ou se está usando valores padrão
- **Regex aplicado**: Mostra o padrão regex utilizado
- **Para cada match encontrado**:
  - Número do match
  - Dia, sequência, descrição e duração
  - Formatação aplicada (dia e sequência com 2 dígitos)

**Exemplo de saída:**
```
🔍 [PDF Parser] Iniciando processamento do arquivo: relatorio_setembro.pdf
📋 [PDF Parser] Colaborador: Eduardo Faller
=== CONTEÚDO EXTRAÍDO DO PDF ===
[conteúdo aqui]
=== FIM DO CONTEÚDO ===

🔍 [extractActivitiesFromText] Iniciando extração de atividades...
📆 [extractActivitiesFromText] Buscando período no conteúdo...
   ✅ Período encontrado: Período: 1 set. 2025
   📅 Período extraído: Mês 9, Ano 2025

✅ [Match 1] Atividade encontrada:
   📍 Dia: 01
   🔢 Sequência: 01
   📝 Descrição: "Revisão tarefas do dia"
   ⏱️  Duração: 0:25
```

---

## 📊 2. TMetricExcelParser (`src/infrastructure/adapters/TMetricExcelParser.ts`)

### Logs no método `parse()`

- **Início do processamento**: Nome do arquivo e colaborador
- **Tamanho do conteúdo**: Quantidade de caracteres lidos
- **Dados parseados**: Número de linhas e preview das primeiras 3 linhas
- **Colunas disponíveis**: Lista de todas as colunas do CSV
- **Conversão de atividades**: Similar ao PDF Parser

### Logs no método `extractActivitiesFromData()`

- **Colunas de data encontradas**: Lista de todas as datas detectadas (formato YYYY-MM-DD)
- **Para cada dia processado**:
  - Separador visual com data
  - Dia do mês extraído
  - **Primeira passagem** (busca de etiquetas):
    - Cada etiqueta verificada
    - Hora de início encontrada (se houver)
    - Hora de almoço encontrada (se houver)
    - Configurações finais do dia (início e almoço)
  - **Segunda passagem** (processamento de atividades):
    - Para cada linha: tarefa, duração e etiqueta
    - Status de validação (pulando ou processando)
    - Match da tarefa (dia, sequência, descrição)
    - Validação do dia da tarefa vs dia da coluna
    - Duração original e normalizada
    - Horas calculadas (início e fim)
    - Verificação de almoço (se aplicável)
    - Confirmação de atividade adicionada

**Exemplo de saída:**
```
🔍 [Excel Parser] Iniciando processamento do arquivo: timesheet.csv
📋 [Excel Parser] Colaborador: Eduardo Faller
📄 [Excel Parser] Conteúdo do arquivo lido, tamanho: 5234 caracteres

📊 [Excel Parser] Dados parseados: 15 linhas
=== PREVIEW DOS DADOS DO CSV ===
Primeiras 3 linhas: [...]
=== FIM DO PREVIEW ===

📋 [Excel Parser] Colunas disponíveis: ['Entrada de tempo', 'Etiquetas', '2025-09-01', '2025-09-02']

============================================================
📆 Processando dia: 2025-09-01
============================================================
📍 Dia do mês extraído: 01

🔍 [Primeira Passagem] Buscando etiquetas de início e almoço...
   🏷️  Verificando etiqueta: "inicio: 8:30"
   ✅ Hora de início encontrada: 8:30 (de etiqueta: "inicio: 8:30")
   🏷️  Verificando etiqueta: "almoço: 12:00"
   ✅ Hora de almoço encontrada: 12:00 (de etiqueta: "almoço: 12:00")

⚙️ Configurações do dia:
   ⏰ Hora de início: 8:30
   🍽️  Hora de almoço: 12:00

🔄 [Segunda Passagem] Processando atividades do dia 2025-09-01...

   📋 Linha: Tarefa="01 - 01 - Revisão tarefas do dia", Duração="0:25", Etiqueta=""
   🔍 Match da tarefa encontrado: Dia=01, Seq=01, Desc="Revisão tarefas do dia"
   ✅ Tarefa válida: dia 01 corresponde ao dia da coluna 01
   📊 Duração original: "0:25"
   ✅ Duração normalizada: "0:25"
   ⏰ Hora calculada: Início=8:30, Fim=8:55
   ✅ [Atividade 1] ADICIONADA
      Início: 8:30 | Fim: 8:55 | Duração: 0:25
      Tarefa: 01 - 01 - Revisão tarefas do dia
   ⏩ Próxima atividade começará às 8:55
```

---

## 🎣 3. useActivities Hook (`src/presentation/hooks/useActivities.ts`)

### Logs adicionados:

- **`loadActivities()`**:
  - Quando é chamado
  - Filtros aplicados (se houver)
  - Quantidade de atividades carregadas
  - Lista de todas as atividades (data, hora, tarefa)

- **`processPDFFiles()`**:
  - Quantidade de arquivos PDF
  - Nomes dos arquivos
  - Colaborador
  - Resultado do processamento
  - Status de sucesso/erro

- **`processExcelFiles()`**:
  - Quantidade de arquivos Excel/CSV
  - Nomes dos arquivos
  - Colaborador
  - Resultado do processamento
  - Status de sucesso/erro

**Exemplo de saída:**
```
📄 [useActivities] processPDFFiles chamado
   1 arquivo(s) PDF: ['relatorio_setembro.pdf']
   Colaborador: Eduardo Faller
📊 [useActivities] Resultado do processamento PDF: { success: true, activitiesProcessed: 45, message: '45 atividades processadas' }
✅ [useActivities] PDF processado com sucesso, recarregando atividades...

🔄 [useActivities] loadActivities chamado
   Filtros: undefined
✅ [useActivities] 45 atividades carregadas do repositório
   [1] 01/09/2025 - 8:00 - 01 - 01 - Revisão tarefas do dia
   [2] 01/09/2025 - 8:25 - 01 - 02 - Daily
   ...
```

---

## 🏗️ 4. Activity Entity (`src/domain/entities/Activity.ts`)

### Logs no método `create()`

Para cada atividade criada, loga:
- ID gerado
- Data (ISO format)
- Hora de início
- Duração
- Descrição da tarefa
- Colaborador
- Hora de fim calculada

**Exemplo de saída:**
```
🏗️  [Activity.create] Criando nova atividade:
   🆔 ID: 123e4567-e89b-12d3-a456-426614174000
   📅 Data: 2025-09-01T00:00:00.000Z
   ⏰ Hora Início: 8:00
   ⏱️  Duração: 0:25
   📝 Tarefa: 01 - 01 - Revisão tarefas do dia
   👤 Colaborador: Eduardo Faller
   ✅ Activity criada com sucesso! Hora fim: 8:25
```

---

## 🔍 Como Usar os Logs

### 1. Abra o Console do Navegador
- Pressione `F12` ou `Ctrl+Shift+I` (Windows/Linux)
- Ou `Cmd+Option+I` (Mac)
- Vá para a aba "Console"

### 2. Faça Upload de um Arquivo
- Clique em "Selecionar Arquivos"
- Escolha um arquivo PDF ou CSV
- Observe os logs no console

### 3. Interpretando os Logs

Os logs seguem um padrão hierárquico com emojis para facilitar a leitura:

- 🔍 = Início de processo
- ✅ = Sucesso/Confirmação
- ⚠️ = Aviso/Informação importante
- ❌ = Erro
- 📄/📊 = Arquivo/Dados
- ⏰/⏱️ = Horários/Duração
- 📝 = Tarefa/Descrição
- 👤 = Colaborador
- 🔄 = Processamento/Loop
- 🍽️ = Almoço

### 4. Fluxo Completo de Logs

Ao fazer upload de um arquivo, você verá:

1. **Hook useActivities** detecta o upload
2. **Parser** (PDF ou Excel) processa o arquivo
3. **Parser** extrai as atividades brutas
4. **Activity.create()** cria cada entidade
5. **Hook** recarrega as atividades
6. **Hook** exibe todas as atividades no repositório

---

## 📝 Notas Importantes

- Todos os logs estão no **console do navegador**, não no terminal
- Os logs são **extremamente detalhados** para facilitar debugging
- Se houver problemas, copie os logs do console e compartilhe para análise
- Os logs mostram **exatamente** como cada campo está sendo capturado e processado

---

## 🛠️ Debugging de Problemas Comuns

### Problema: Nenhuma atividade extraída

**Verifique nos logs:**
1. O conteúdo do PDF foi extraído corretamente?
2. O regex está encontrando matches?
3. As colunas de data foram identificadas no CSV?

### Problema: Datas incorretas

**Verifique nos logs:**
1. O período foi detectado corretamente?
2. O mês e ano extraídos estão corretos?
3. A conversão para Date está funcionando?

### Problema: Horários errados

**Verifique nos logs:**
1. A hora de início do dia está correta?
2. A hora de almoço foi detectada (se configurada)?
3. Os cálculos de hora fim estão corretos?

### Problema: Tarefas duplicadas ou faltando

**Verifique nos logs:**
1. Quantas atividades foram encontradas no arquivo?
2. Quantas foram realmente criadas?
3. Há mensagens de "pulando" indicando filtros aplicados?

---

## 🎓 Conclusão

Com estes logs implementados, você tem **visibilidade total** do processo de extração e criação de atividades. Qualquer problema pode ser rapidamente identificado seguindo o fluxo de logs no console do navegador.
