# Planilha de Atividades - TMetric

Sistema de gerenciamento e exportação de atividades do TMetric, construído com arquitetura limpa seguindo os princípios de **Domain-Driven Design (DDD)** e **SOLID**.

## 🚀 Funcionalidades

- ✅ Importação de relatórios PDF do TMetric
- ✅ Importação de relatórios CSV/Excel do TMetric
- ✅ Visualização e filtragem de atividades
- ✅ Exportação para Excel com múltiplas abas
- ✅ Estatísticas de horas trabalhadas
- ✅ Persistência local (LocalStorage)
- ✅ Interface responsiva e intuitiva

## 🏗️ Arquitetura

O projeto segue uma arquitetura em camadas baseada em **DDD** e **SOLID**:

```
src/
├── domain/                # Regras de negócio puras
│   ├── entities/         # Entidades (Activity)
│   ├── value-objects/    # Objetos de valor (TimeRange, DateVO)
│   ├── repositories/     # Interfaces dos repositórios
│   └── services/         # Serviços de domínio
├── application/          # Casos de uso
│   ├── use-cases/       # Lógica de aplicação
│   └── ports/           # Interfaces para adaptadores
├── infrastructure/       # Implementações técnicas
│   ├── adapters/        # Parsers e exporters
│   ├── repositories/    # Implementação de repositórios
│   └── DependencyContainer.ts
└── presentation/        # Interface do usuário
    ├── hooks/          # Custom hooks React
    └── pages/          # Páginas da aplicação
```

### Princípios Aplicados

- **Single Responsibility**: Cada classe tem uma única responsabilidade
- **Open/Closed**: Aberto para extensão, fechado para modificação
- **Liskov Substitution**: Implementações são intercambiáveis
- **Interface Segregation**: Interfaces específicas e focadas
- **Dependency Inversion**: Dependência de abstrações, não de implementações concretas

## 🛠️ Tecnologias

- **React** 18.2 + TypeScript
- **Vite** - Build tool
- **TailwindCSS** - Estilização
- **ExcelJS** - Geração de planilhas
- **PDF.js** - Leitura de PDFs
- **PapaParser** - Parsing de CSV

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

## 📚 Documentação

- [**Arquitetura Detalhada**](docs/ARCHITECTURE.md) - Explicação completa da arquitetura DDD/SOLID
- [**Guia de Integração com Banco de Dados**](docs/DATABASE_INTEGRATION.md) - Como integrar com PostgreSQL, MongoDB, etc
- [**Guia de Desenvolvimento**](docs/DEVELOPMENT_GUIDE.md) - Boas práticas e como adicionar novas funcionalidades

## 🎯 Como Usar

### 1. Formatação no TMetric

As tarefas devem seguir o padrão:

```
DD - NN - Descrição
```

- **DD** = Dia do mês (01, 02, 03...)
- **NN** = Número sequencial da tarefa no dia
- **Descrição** = Descrição da atividade

**Exemplo**: `01 - 01 - Revisão tarefas do dia`

### 2. Etiquetas Especiais (CSV/Excel)

- `inicio: HH:MM` - Define horário de início do dia
- `almoço: HH:MM` - Define pausa para almoço

### 3. Importação

1. Clique em "Selecionar Arquivos"
2. Escolha arquivos PDF ou CSV/Excel do TMetric
3. As atividades serão processadas automaticamente

### 4. Exportação

- Clique em "Baixar Excel" para exportar
- Gerado arquivo com 3 abas:
  - **Atividades**: Lista completa
  - **Lancto Horas**: Planilha de lançamento
  - **Resumo Financeiro**: Cálculos financeiros

## 🔄 Futura Integração com Banco de Dados

A arquitetura atual está preparada para integração com banco de dados sem mudanças no domínio:

1. Implementar novo repositório (ex: `PrismaActivityRepository`)
2. Atualizar `DependencyContainer`
3. Zero mudanças na lógica de negócio ou UI

Veja o [guia completo de integração](docs/DATABASE_INTEGRATION.md) para mais detalhes.

## 🧪 Testes

```bash
# Executar testes
npm test

# Testes em watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

## 📈 Próximos Passos

- [ ] Adicionar autenticação de usuários
- [ ] Integração com banco de dados PostgreSQL
- [ ] API REST para sincronização
- [ ] Relatórios avançados e gráficos
- [ ] Exportação para outros formatos (PDF, JSON)
- [ ] Modo escuro
- [ ] Testes automatizados completos

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 🐛 Solução de Problemas

### Erro: "Identifier 'READER_LINE_CLASS' has already been declared"

```bash
rm -rf node_modules/.vite
npm run dev
```

### Reinstalar dependências

```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

## 📝 Licença

Este projeto está sob a licença MIT.

## 👤 Autor

**Eduardo Faller**