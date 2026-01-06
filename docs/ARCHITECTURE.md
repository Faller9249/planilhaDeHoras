# Arquitetura da Aplicação

## Visão Geral

Esta aplicação segue os princípios de **Domain-Driven Design (DDD)** e **SOLID**, organizando o código em camadas bem definidas e desacopladas.

## Estrutura de Camadas

```
src/
├── domain/                    # Camada de Domínio
│   ├── entities/             # Entidades do negócio
│   ├── value-objects/        # Objetos de valor imutáveis
│   ├── repositories/         # Interfaces dos repositórios
│   └── services/             # Serviços de domínio
├── application/              # Camada de Aplicação
│   ├── use-cases/           # Casos de uso da aplicação
│   └── ports/               # Interfaces (portas) para infraestrutura
├── infrastructure/           # Camada de Infraestrutura
│   ├── adapters/            # Implementações de parsers e exporters
│   ├── repositories/        # Implementações dos repositórios
│   └── DependencyContainer.ts # Injeção de dependências
└── presentation/            # Camada de Apresentação
    ├── components/          # Componentes React reutilizáveis
    ├── hooks/              # Custom hooks
    └── pages/              # Páginas da aplicação
```

## Camadas Detalhadas

### 1. Domain (Domínio)

**Responsabilidade**: Contém a lógica de negócio pura, independente de frameworks e tecnologias externas.

#### Entities (Entidades)
- `Activity`: Entidade principal que representa uma atividade
- Contém identificador único, atributos e comportamentos do domínio
- Usa factory methods para criação e reconstrução

#### Value Objects (Objetos de Valor)
- `TimeRange`: Representa um intervalo de tempo
- `DateVO`: Representa uma data com validações e formatações
- São imutáveis e contêm validações

#### Repositories (Interfaces)
- `IActivityRepository`: Define o contrato para persistência de atividades
- Independente da implementação (LocalStorage, banco de dados, etc)

#### Services (Serviços de Domínio)
- `ActivityDomainService`: Contém lógica de negócio que envolve múltiplas entidades
- Funções estáticas para operações como agrupamento, ordenação, cálculos

### 2. Application (Aplicação)

**Responsabilidade**: Orquestra o fluxo da aplicação através de casos de uso.

#### Use Cases (Casos de Uso)
- `ProcessPDFFileUseCase`: Processar arquivos PDF do TMetric
- `ProcessExcelFileUseCase`: Processar arquivos Excel/CSV
- `GetActivitiesUseCase`: Obter e filtrar atividades
- `ExportToExcelUseCase`: Exportar atividades para Excel
- `GetActivitiesStatisticsUseCase`: Calcular estatísticas
- `ClearAllActivitiesUseCase`: Limpar todas as atividades

#### Ports (Portas)
Interfaces que definem contratos para adaptadores externos:
- `IPDFParser`: Interface para parser de PDF
- `IExcelParser`: Interface para parser de Excel/CSV
- `IExcelExporter`: Interface para exportador de Excel

### 3. Infrastructure (Infraestrutura)

**Responsabilidade**: Implementa detalhes técnicos e integrações com o mundo externo.

#### Repositories (Implementações)
- `InMemoryActivityRepository`: Implementação com LocalStorage
- Futuramente pode ser substituído por implementação com banco de dados

#### Adapters (Adaptadores)
- `TMetricPDFParser`: Parser específico para PDFs do TMetric
- `TMetricExcelParser`: Parser para Excel/CSV do TMetric
- `ExcelJSExporter`: Exportador usando biblioteca ExcelJS

#### DependencyContainer
- Container de injeção de dependências
- Centraliza criação e configuração de todas as dependências
- Padrão Singleton

### 4. Presentation (Apresentação)

**Responsabilidade**: Interface com o usuário.

#### Hooks
- `useActivities`: Gerencia estado e operações de atividades
- `useActivityStatistics`: Gerencia estatísticas

#### Pages
- `ActivitiesPage`: Página principal da aplicação

## Princípios SOLID Aplicados

### Single Responsibility Principle (SRP)
- Cada classe/módulo tem uma única responsabilidade
- Use Cases são focados em um único objetivo
- Entidades contêm apenas lógica relacionada a si mesmas

### Open/Closed Principle (OCP)
- Sistema aberto para extensão, fechado para modificação
- Novas implementações de parsers podem ser adicionadas sem modificar use cases
- Novos repositórios podem ser implementados sem alterar o domínio

### Liskov Substitution Principle (LSP)
- Implementações de interfaces podem ser substituídas sem quebrar o sistema
- Qualquer implementação de `IActivityRepository` funciona da mesma forma

### Interface Segregation Principle (ISP)
- Interfaces específicas e focadas (IPDFParser, IExcelParser, etc)
- Clientes não dependem de métodos que não usam

### Dependency Inversion Principle (DIP)
- Camadas de alto nível não dependem de camadas de baixo nível
- Ambas dependem de abstrações (interfaces)
- Use Cases dependem de interfaces, não de implementações concretas

## Fluxo de Dados

```
User Input (Presentation)
    ↓
Custom Hook
    ↓
Use Case (Application)
    ↓
Domain Service / Repository Interface
    ↓
Repository Implementation (Infrastructure)
    ↓
LocalStorage / External Service
```

## Preparação para Banco de Dados

A arquitetura atual está preparada para integração com banco de dados:

1. **Repositório Abstrato**: Interface `IActivityRepository` define o contrato
2. **Implementação Isolada**: `InMemoryActivityRepository` pode ser substituído
3. **Use Cases Agnósticos**: Não conhecem detalhes de persistência
4. **Migration Path**:
   - Criar `DatabaseActivityRepository implements IActivityRepository`
   - Atualizar `DependencyContainer` para usar nova implementação
   - Zero mudanças no domínio e casos de uso

### Exemplo de Futura Implementação com Banco

```typescript
// infrastructure/repositories/DatabaseActivityRepository.ts
export class DatabaseActivityRepository implements IActivityRepository {
  constructor(private dbClient: PrismaClient) {}

  async save(activity: Activity): Promise<void> {
    await this.dbClient.activity.create({
      data: {
        id: activity.id,
        date: activity.date,
        startTime: activity.startTime,
        duration: activity.duration,
        task: activity.task,
        collaborator: activity.collaborator
      }
    });
  }
  // ... outras implementações
}

// infrastructure/DependencyContainer.ts
private readonly activityRepository = new DatabaseActivityRepository(prisma);
```

## Vantagens da Arquitetura

1. **Testabilidade**: Cada camada pode ser testada isoladamente
2. **Manutenibilidade**: Mudanças são localizadas e controladas
3. **Escalabilidade**: Fácil adicionar novas funcionalidades
4. **Flexibilidade**: Tecnologias podem ser trocadas sem impacto no negócio
5. **Clareza**: Estrutura clara e intuitiva para novos desenvolvedores

## Exemplos de Extensão

### Adicionar Suporte para Usuários

1. Criar `User` entity no domínio
2. Criar `IUserRepository` interface
3. Criar use cases: `CreateUserUseCase`, `AuthenticateUserUseCase`
4. Implementar repositório (LocalStorage ou banco)
5. Adicionar hooks e componentes na presentation
6. Atualizar `Activity` para referenciar `User`

### Integrar com API Externa

1. Criar interface na camada application/ports
2. Implementar adapter na infraestrutura
3. Injetar via `DependencyContainer`
4. Usar em use cases

## Boas Práticas

1. **Nunca** importe camadas de infraestrutura no domínio
2. **Sempre** use interfaces para dependências externas
3. **Mantenha** entidades ricas com comportamentos relevantes
4. **Utilize** value objects para conceitos imutáveis
5. **Centralize** lógica de negócio no domínio
6. **Isole** lógica de apresentação nos componentes React
7. **Teste** cada camada independentemente
