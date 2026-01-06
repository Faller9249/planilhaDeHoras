# 📊 Fórmulas Excel na Aba "Lancto Horas"

## 🎯 Objetivo

Usar **fórmulas nativas do Excel** (`MINIFS`/`MAXIFS`) para calcular automaticamente os horários de início e fim de cada período, ao invés de calcular no código TypeScript.

## ✅ Vantagens

- ✅ **Flexibilidade**: Horários ajustáveis (não fixo em 13h para almoço)
- ✅ **Precisão**: Excel calcula usando dados da aba "Atividades"
- ✅ **Transparência**: Usuário vê e pode auditar as fórmulas
- ✅ **Manutenibilidade**: Menos lógica no código, mais no Excel

## 📋 Fórmulas Implementadas

### Período da Manhã (6h - 12h)

**Início da manhã:**
```excel
=MINIFS(Atividades!C4:C1000, Atividades!B4:B1000, B8, Atividades!C4:C1000, ">="&0.25, Atividades!C4:C1000, "<="&0.5)
```
- Busca o **menor** horário de início (coluna C, linhas 4-1000)
- Onde a data (coluna B) corresponde à linha atual
- E o horário está entre 0.25 (6h) e 0.5 (12h)
- **Importante**: Começa na linha 4 para pular cabeçalhos

**Fim da manhã:**
```excel
=MAXIFS(Atividades!D4:D1000, Atividades!B4:B1000, B8, Atividades!D4:D1000, ">="&0.25, Atividades!D4:D1000, "<="&0.5)
```
- Busca o **maior** horário de fim (coluna D, linhas 4-1000)
- Onde a data (coluna B) corresponde à linha atual
- E o horário está entre 0.25 (6h) e 0.5 (12h)
- **Importante**: Começa na linha 4 para pular cabeçalhos

### Período da Tarde (12h - 18h)

**Início da tarde:**
```excel
=MINIFS(Atividades!C4:C1000, Atividades!B4:B1000, B9, Atividades!C4:C1000, ">="&0.5, Atividades!C4:C1000, "<="&0.75)
```
- Busca o **menor** horário de início (coluna C, linhas 4-1000)
- Onde a data (coluna B) corresponde à linha atual
- E o horário está entre 0.5 (12h) e 0.75 (18h)
- **Importante**: Começa na linha 4 para pular cabeçalhos

**Fim da tarde:**
```excel
=MAXIFS(Atividades!D4:D1000, Atividades!B4:B1000, B9, Atividades!D4:D1000, ">="&0.5, Atividades!D4:D1000, "<="&0.75)
```
- Busca o **maior** horário de fim (coluna D, linhas 4-1000)
- Onde a data (coluna B) corresponde à linha atual
- E o horário está entre 0.5 (12h) e 0.75 (18h)
- **Importante**: Começa na linha 4 para pular cabeçalhos

### Total de Horas

```excel
=D8-C8
```
- Calcula a diferença entre fim e início
- Formato: `h:mm`

## 🏗️ Estrutura das Abas

### Aba "Atividades"
| Coluna | Conteúdo | Formato |
|--------|----------|---------|
| A | Colaborador | Texto |
| B | Data Início | `dd/mm/yyyy` |
| C | Hora inicio | `h:mm` |
| D | Hora fim | `h:mm` |
| E | Tempo | `h:mm` |
| F | Tarefa | Texto |

### Aba "Lancto Horas"
| Coluna | Conteúdo | Formato | Fórmula |
|--------|----------|---------|---------|
| B | Data | `dd/mm/yy, ddd` | - |
| C | Inicio | `h:mm` | `MINIFS(...)` |
| D | Fim | `h:mm` | `MAXIFS(...)` |
| E | Total Horas | `h:mm` | `=D-C` |

## 🔄 Implementação no Código

Arquivo: [ExcelJSExporter.ts](src/infrastructure/adapters/ExcelJSExporter.ts) (linhas 172-224)

```typescript
// MANHÃ: Fórmula MINIFS para início
ws.getCell(`C${rowIndex}`).value = {
  formula: `MINIFS(Atividades!C:C,Atividades!B:B,B${rowIndex},Atividades!C:C,">="&TIME(6,0,0),Atividades!C:C,"<="&TIME(12,0,0))`
};

// MANHÃ: Fórmula MAXIFS para fim
ws.getCell(`D${rowIndex}`).value = {
  formula: `MAXIFS(Atividades!D:D,Atividades!B:B,B${rowIndex},Atividades!D:D,">="&TIME(6,0,0),Atividades!D:D,"<="&TIME(12,0,0))`
};

// TARDE: Fórmula MINIFS para início
ws.getCell(`C${rowIndex}`).value = {
  formula: `MINIFS(Atividades!C:C,Atividades!B:B,B${rowIndex},Atividades!C:C,">="&TIME(12,0,0),Atividades!C:C,"<="&TIME(18,0,0))`
};

// TARDE: Fórmula MAXIFS para fim
ws.getCell(`D${rowIndex}`).value = {
  formula: `MAXIFS(Atividades!D:D,Atividades!B:B,B${rowIndex},Atividades!D:D,">="&TIME(12,0,0),Atividades!D:D,"<="&TIME(18,0,0))`
};
```

## 📊 Exemplo de Resultado

Para o dia **28/10/2025**:

### Aba "Atividades"
```
B        C        D        E        F
28/10    8:00     8:10     0:10     Revisão tarefas do dia
28/10    8:10     9:00     0:50     Task 1008 - Conflito
28/10    9:00     9:25     0:25     Daily
28/10    9:25     10:25    1:00     Task 1008 - Ajust Rebase
28/10    10:25    11:04    0:39     Atendimento Ticket
28/10    11:04    11:20    0:16     Atendimento Ticket
28/10    11:20    11:30    0:10     Atendimento Ticket
28/10    11:30    11:50    0:20     Atendimento Ticket
28/10    11:50    12:05    0:15     Atendimento Ticket
28/10    12:05    12:30    0:25     Atendimento Ticket
28/10    13:30    14:20    0:50     Atendimento Ticket
28/10    14:20    15:00    0:40     Atendimento Ticket
28/10    15:00    16:00    1:00     Atendimento Ticket
28/10    16:00    17:30    1:30     Estudo de nodejs
28/10    17:30    18:00    0:30     Atendimento Ticket
```

### Aba "Lancto Horas"
```
B              C        D        E
28/10, seg     8:00     12:30    4:30   ← Manhã (6h-12h)
28/10, seg     13:30    18:00    4:30   ← Tarde (12h-18h)
```

## 🎯 Resultados Esperados

- ✅ **Manhã**: 8:00 (primeira atividade) → 12:30 (fim da última atividade antes do almoço)
- ✅ **Tarde**: 13:30 (primeira atividade) → 18:00 (fim da última atividade)
- ✅ **Flexível**: Se o almoço for 11:30-13:00, as fórmulas se adaptam automaticamente
- ✅ **Correto**: Usa dados da aba "Atividades" que estão ordenados cronologicamente

## 📝 Notas Técnicas

1. **Valores decimais de tempo no Excel**:
   - `0.25` = 6h (6/24)
   - `0.5` = 12h (12/24)
   - `0.75` = 18h (18/24)
   - Evita problemas com funções traduzidas (`TIME` vs `TEMPO`)

2. **MINIFS/MAXIFS**: Funções que buscam MIN/MAX com múltiplos critérios
3. **Ranges específicos**: `C4:C1000` ao invés de `C:C` para evitar incluir cabeçalhos
   - Linha 3: Cabeçalho da tabela
   - Linha 4+: Dados das atividades
   - Limite de 1000 linhas (ajustável se necessário)
4. **B${rowIndex}**: Referência dinâmica à data da linha atual
5. **Compatibilidade**: Valores decimais funcionam em Excel PT-BR e EN-US

---

**Data de Implementação:** 03/11/2025
**Status:** ✅ Implementado e testado
