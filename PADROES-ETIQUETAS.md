# 🏷️ Guia Completo de Etiquetas - Padrões Flexíveis

## 📋 Introdução

O sistema agora detecta **múltiplos formatos** de etiquetas para horários de início e almoço. Você não precisa se preocupar com formatação exata - o sistema é inteligente o suficiente para entender várias variações!

---

## ✅ Padrões Detectados Automaticamente

### 🌅 Etiquetas de Início do Dia

O sistema detecta qualquer uma dessas variações:

| Formato | Exemplo | Status |
|---------|---------|--------|
| **Espaço simples** | `inicio 8:30` | ✅ Recomendado |
| **Com dois-pontos** | `inicio: 8:30` | ✅ Funciona |
| **Sem espaço** | `inicio:8:30` | ✅ Funciona |
| **Com "h"** | `inicio 8h30` | ✅ Funciona |
| **Horários variados** | `inicio 8:00`, `inicio 8:15`, `inicio 8:20`, `inicio 10:30` | ✅ Todos funcionam |
| **Case insensitive** | `Inicio 8:30`, `INICIO 8:30` | ✅ Funciona |

### 🍽️ Etiquetas de Almoço

O sistema detecta qualquer uma dessas variações:

| Formato | Exemplo | Status |
|---------|---------|--------|
| **Sem acento** | `almoco 12:00` | ✅ Recomendado |
| **Com acento** | `almoço 12:00` | ✅ Funciona |
| **Com dois-pontos** | `almoco: 12:00`, `almoço: 12:00` | ✅ Funciona |
| **Sem espaço** | `almoco:12:00`, `almoço:12:30` | ✅ Funciona |
| **Com "h"** | `almoco 12h00`, `almoço 12h30` | ✅ Funciona |
| **Horários variados** | `almoco 12:00`, `almoco 12:20`, `almoco 12:30` | ✅ Todos funcionam |
| **Case insensitive** | `Almoco 12:00`, `ALMOÇO 12:00` | ✅ Funciona |

---

## 🔍 Como o Sistema Detecta

### Regex Utilizado

```typescript
// Para detectar início
/inicio[:\s]*(\d{1,2})[:\sh]*(\d{2})/i

// Para detectar almoço
/(almo[cç]o)[:\s]*(\d{1,2})[:\sh]*(\d{2})/i
```

### O que isso significa?

- `[:\s]*` - Aceita zero ou mais dois-pontos ou espaços
- `(\d{1,2})` - Captura 1 ou 2 dígitos (horas)
- `[:\sh]*` - Aceita zero ou mais dois-pontos, espaços ou "h"
- `(\d{2})` - Captura 2 dígitos (minutos)
- `/i` - Case insensitive (maiúsculas ou minúsculas)
- `almo[cç]o` - Aceita "almoco" ou "almoço"

---

## 📊 Exemplos Reais dos Seus Arquivos

### Encontrados em `Timesheet_Eduardo_Faller_Week_20250929_20251005.csv`:

```csv
inicio 8:30    → Detectado como 8:30
almoco 12:30   → Detectado como 12:30
inicio 8:15    → Detectado como 8:15
almoco 12:00   → Detectado como 12:00
```

### Encontrados em `Timesheet_Eduardo_Faller_Week_20251013_20251019.csv`:

```csv
inicio 8:00    → Detectado como 8:00
almoco 12:20   → Detectado como 12:20
inicio 8:20    → Detectado como 8:20
almoco 12:30   → Detectado como 12:30
```

---

## 💡 Casos de Uso

### Caso 1: Dia Normal (8:30 às 18:00)

```csv
Etiquetas: inicio 8:30
Etiquetas: almoco 12:00
```

**Resultado:**
- Atividades começam às 8:30
- Pausa de almoço das 12:00 às 13:00
- Atividades continuam após às 13:00

---

### Caso 2: Dia Começando Tarde (10:30 às 12:30)

```csv
Etiquetas: inicio 10:30
Etiquetas: almoco 12:30
```

**Resultado:**
- Atividades começam às 10:30
- Trabalha até 12:30
- Pausa de almoço das 12:30 às 13:30

---

### Caso 3: Horários Diferentes por Dia

**Segunda-feira:**
```csv
Etiquetas: inicio 8:00
Etiquetas: almoco 12:00
```

**Terça-feira:**
```csv
Etiquetas: inicio 9:00
Etiquetas: almoco 12:30
```

**Resultado:**
- Cada dia tem seu próprio horário
- Sistema calcula automaticamente

---

## 🎯 Melhores Práticas

### ✅ Recomendado

1. **Use o formato simples** (sem pontuação extra):
   ```
   inicio 8:30
   almoco 12:00
   ```

2. **Coloque a etiqueta na primeira tarefa** do dia para o início

3. **Coloque a etiqueta na tarefa** que termina no horário de almoço

4. **Seja consistente** no mesmo arquivo (escolha um formato e use sempre)

### ❌ Evite

1. Misturar formatos no mesmo arquivo (funciona, mas confunde visualmente)
2. Usar pontos decimais (ex: `inicio 8.30`) - não funciona
3. Usar vírgulas (ex: `inicio 8,30`) - não funciona
4. Esquecer os minutos (ex: `inicio 8`) - não funciona

---

## 🔬 Testando os Padrões

### Console do Navegador

Ao fazer upload, você verá:

```
🏷️  Verificando etiqueta: "inicio 8:30"
✅ Hora de início encontrada: 8:30 (de etiqueta: "inicio 8:30")

🏷️  Verificando etiqueta: "almoco 12:00"
✅ Hora de almoço encontrada: 12:00 (de etiqueta: "almoco 12:00")
```

Se a etiqueta **não for detectada**, você verá apenas:
```
🏷️  Verificando etiqueta: "algo errado"
```

---

## 📈 Estatísticas dos Seus Arquivos

Baseado nos 5 arquivos CSV analisados:

- **Total de dias com etiqueta de início**: ~35 dias
- **Horários de início mais comuns**:
  - `8:30` (mais frequente)
  - `8:00`
  - `8:15`
  - `8:20`

- **Total de dias com etiqueta de almoço**: ~35 dias
- **Horários de almoço mais comuns**:
  - `12:00` (mais frequente)
  - `12:30`
  - `12:20`

---

## 🛠️ Solução de Problemas

### Problema: Etiqueta não é detectada

**Verifique:**
1. A palavra está escrita corretamente? (`inicio` ou `almoco/almoço`)
2. Tem números no formato HH:MM? (ex: `8:30`)
3. Os minutos têm 2 dígitos? (ex: `8:05`, não `8:5`)

**Exemplos que NÃO funcionam:**
- `inicio 8` (faltam os minutos)
- `comeco 8:30` (palavra errada)
- `almoco 12` (faltam os minutos)
- `inicio as 8:30` (palavra extra)

---

### Problema: Horários errados na planilha final

**Causas comuns:**
1. Etiqueta em dia errado (ex: etiqueta de dia 01 na tarefa de dia 02)
2. Múltiplas etiquetas conflitantes no mesmo dia
3. Etiqueta sem tarefa válida (formato DD - NN - Descrição)

**Solução:**
- Verifique os logs no console
- Confirme que cada dia tem no máximo uma etiqueta de `inicio`
- Confirme que cada dia tem no máximo uma etiqueta de `almoco`

---

## ✨ Conclusão

O sistema é **flexível e inteligente** - você pode usar o formato que preferir! Os padrões mais comuns encontrados nos seus arquivos já funcionam perfeitamente.

**Formato recomendado para novos arquivos:**
```
inicio 8:30
almoco 12:00
```

Simples, limpo e funciona 100%! 🎯
