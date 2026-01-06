# Guia de Desenvolvimento

## Setup do Projeto

### Pré-requisitos

- Node.js >= 18
- npm ou yarn

### Instalação

```bash
npm install
```

### Executar em Desenvolvimento

```bash
npm run dev
```

### Build para Produção

```bash
npm run build
```

### Preview do Build

```bash
npm run preview
```

## Estrutura do Projeto

```
src/
├── domain/                    # Regras de negócio puras
├── application/              # Casos de uso
├── infrastructure/           # Implementações técnicas
└── presentation/            # UI e componentes React
```

## Adicionando Novas Funcionalidades

### 1. Adicionar Nova Entidade do Domínio

**Exemplo**: Adicionar entidade `User`

1. Criar entidade:
```typescript
// src/domain/entities/User.ts
export class User {
  private constructor(
    private readonly _id: string,
    private _name: string,
    private _email: string
  ) {}

  static create(params: { name: string; email: string }): User {
    const id = crypto.randomUUID();
    return new User(id, params.name, params.email);
  }

  get id(): string { return this._id; }
  get name(): string { return this._name; }
  get email(): string { return this._email; }

  // Validações e métodos de negócio
  updateEmail(newEmail: string): void {
    if (!this.isValidEmail(newEmail)) {
      throw new Error('Invalid email');
    }
    this._email = newEmail;
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  toJSON() {
    return {
      id: this._id,
      name: this._name,
      email: this._email
    };
  }
}
```

2. Criar repositório:
```typescript
// src/domain/repositories/IUserRepository.ts
import { User } from '../entities/User';

export interface IUserRepository {
  save(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  update(user: User): Promise<void>;
  delete(id: string): Promise<void>;
}
```

3. Implementar repositório:
```typescript
// src/infrastructure/repositories/InMemoryUserRepository.ts
import { User } from '../../domain/entities/User';
import { IUserRepository } from '../../domain/repositories/IUserRepository';

export class InMemoryUserRepository implements IUserRepository {
  private users: User[] = [];
  private readonly STORAGE_KEY = 'users_data';

  constructor() {
    this.loadFromStorage();
  }

  // ... implementar métodos
}
```

### 2. Adicionar Novo Caso de Uso

**Exemplo**: Criar usuário

```typescript
// src/application/use-cases/CreateUserUseCase.ts
import { User } from '../../domain/entities/User';
import { IUserRepository } from '../../domain/repositories/IUserRepository';

export class CreateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(params: {
    name: string;
    email: string;
  }): Promise<{ success: boolean; user?: User; message: string }> {
    try {
      // Validar se email já existe
      const existingUser = await this.userRepository.findByEmail(params.email);

      if (existingUser) {
        return {
          success: false,
          message: 'Email já cadastrado'
        };
      }

      // Criar e salvar usuário
      const user = User.create(params);
      await this.userRepository.save(user);

      return {
        success: true,
        user,
        message: 'Usuário criado com sucesso'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
}
```

### 3. Adicionar Novo Hook

```typescript
// src/presentation/hooks/useUser.ts
import { useState, useCallback } from 'react';
import { User } from '../../domain/entities/User';
import { DependencyContainer } from '../../infrastructure/DependencyContainer';

export const useUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const container = DependencyContainer.getInstance();

  const createUser = useCallback(async (name: string, email: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await container.createUserUseCase.execute({ name, email });
      if (result.success && result.user) {
        setUser(result.user);
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar usuário';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [container]);

  return {
    user,
    loading,
    error,
    createUser
  };
};
```

### 4. Atualizar DependencyContainer

```typescript
// src/infrastructure/DependencyContainer.ts

// Adicionar repositório
private readonly userRepository = new InMemoryUserRepository();

// Adicionar use case
public readonly createUserUseCase = new CreateUserUseCase(
  this.userRepository
);
```

## Boas Práticas de Código

### 1. Nomenclatura

- **Classes**: PascalCase (`Activity`, `User`)
- **Interfaces**: PascalCase com prefixo `I` (`IActivityRepository`)
- **Funções/Métodos**: camelCase (`calculateEndTime`, `findById`)
- **Constantes**: UPPER_SNAKE_CASE (`STORAGE_KEY`, `MAX_RETRIES`)
- **Arquivos**: PascalCase para classes, camelCase para utilitários

### 2. Organização de Imports

```typescript
// 1. Imports externos
import { useState, useCallback } from 'react';
import Papa from 'papaparse';

// 2. Imports do domínio
import { Activity } from '../../domain/entities/Activity';
import { IActivityRepository } from '../../domain/repositories/IActivityRepository';

// 3. Imports de aplicação
import { GetActivitiesUseCase } from '../../application/use-cases/GetActivitiesUseCase';

// 4. Imports de infraestrutura
import { DependencyContainer } from '../../infrastructure/DependencyContainer';

// 5. Imports locais
import { SomeLocalComponent } from './SomeLocalComponent';
```

### 3. Tratamento de Erros

```typescript
// ✓ Bom
try {
  const result = await someOperation();
  return { success: true, data: result };
} catch (error) {
  console.error('Context about the error:', error);
  return {
    success: false,
    message: error instanceof Error ? error.message : 'Unknown error'
  };
}

// ✗ Ruim
try {
  return await someOperation();
} catch (error) {
  throw error; // Não adiciona contexto
}
```

### 4. Validações

```typescript
// Validar no domínio (entidades/value objects)
export class Email {
  private constructor(private readonly value: string) {
    this.validate();
  }

  private validate(): void {
    if (!this.isValid(this.value)) {
      throw new Error('Invalid email format');
    }
  }

  private isValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
```

### 5. Uso de Value Objects

```typescript
// ✓ Bom: Usar value objects para conceitos do domínio
const dateVO = DateVO.fromString('2025-09-01');
const timeRange = TimeRange.create('8:00', '17:00');

// ✗ Ruim: Usar strings/números primitivos
const date = '2025-09-01';
const startTime = '8:00';
const endTime = '17:00';
```

## Testando a Aplicação

### Testes Unitários

```typescript
// domain/entities/Activity.test.ts
import { describe, it, expect } from 'vitest';
import { Activity } from './Activity';

describe('Activity Entity', () => {
  it('should create an activity with valid data', () => {
    const activity = Activity.create({
      date: new Date('2025-09-01'),
      startTime: '8:00',
      duration: '1:00',
      task: 'Test task',
      collaborator: 'John Doe'
    });

    expect(activity.task).toBe('Test task');
    expect(activity.startTime).toBe('8:00');
  });

  it('should calculate end time correctly', () => {
    const activity = Activity.create({
      date: new Date('2025-09-01'),
      startTime: '8:00',
      duration: '1:30',
      task: 'Test',
      collaborator: 'John'
    });

    expect(activity.calculateEndTime()).toBe('9:30');
  });

  it('should throw error when updating with empty task', () => {
    const activity = Activity.create({
      date: new Date('2025-09-01'),
      startTime: '8:00',
      duration: '1:00',
      task: 'Original',
      collaborator: 'John'
    });

    expect(() => activity.updateTask('')).toThrow('Task cannot be empty');
  });
});
```

### Testes de Use Cases

```typescript
// application/use-cases/GetActivitiesUseCase.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { GetActivitiesUseCase } from './GetActivitiesUseCase';
import { InMemoryActivityRepository } from '../../infrastructure/repositories/InMemoryActivityRepository';
import { Activity } from '../../domain/entities/Activity';

describe('GetActivitiesUseCase', () => {
  let repository: InMemoryActivityRepository;
  let useCase: GetActivitiesUseCase;

  beforeEach(() => {
    repository = new InMemoryActivityRepository();
    useCase = new GetActivitiesUseCase(repository);
  });

  it('should return all activities', async () => {
    const activity = Activity.create({
      date: new Date('2025-09-01'),
      startTime: '8:00',
      duration: '1:00',
      task: 'Test',
      collaborator: 'John'
    });

    await repository.save(activity);

    const result = await useCase.execute();

    expect(result).toHaveLength(1);
    expect(result[0].task).toBe('Test');
  });

  it('should filter activities by task', async () => {
    const activity1 = Activity.create({
      date: new Date('2025-09-01'),
      startTime: '8:00',
      duration: '1:00',
      task: 'Meeting',
      collaborator: 'John'
    });

    const activity2 = Activity.create({
      date: new Date('2025-09-01'),
      startTime: '9:00',
      duration: '1:00',
      task: 'Development',
      collaborator: 'John'
    });

    await repository.saveMany([activity1, activity2]);

    const result = await useCase.execute({
      taskFilter: 'meeting'
    });

    expect(result).toHaveLength(1);
    expect(result[0].task).toBe('Meeting');
  });
});
```

## Debug

### Logs de Desenvolvimento

```typescript
// Usar console.log estrategicamente
console.log('=== Processing Activities ===');
console.log('Input:', activities);
console.log('Result:', processedActivities);
```

### Debug no VSCode

`.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome against localhost",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/src"
    }
  ]
}
```

## Performance

### Otimizações

1. **Memoização de cálculos pesados**
```typescript
import { useMemo } from 'react';

const statistics = useMemo(() => {
  return ActivityDomainService.calculateStatistics(activities);
}, [activities]);
```

2. **Debounce em filtros**
```typescript
import { useDebounce } from './hooks/useDebounce';

const debouncedTaskFilter = useDebounce(taskFilter, 300);
```

3. **Virtualização de listas longas**
```typescript
// Considerar react-window ou react-virtual para listas com > 1000 itens
```

## Deployment

### Build Otimizado

```bash
npm run build
```

### Variáveis de Ambiente

Criar `.env.production`:
```
VITE_USE_DATABASE=true
VITE_API_URL=https://api.example.com
```

### Deploy

Seguir documentação do provedor:
- **Vercel**: `vercel deploy`
- **Netlify**: `netlify deploy --prod`
- **GitHub Pages**: Usar workflow de Actions

## Troubleshooting

### Problema: LocalStorage cheio

```typescript
// Limpar dados antigos
localStorage.clear();
```

### Problema: Atividades não carregando

1. Verificar console do navegador (F12)
2. Verificar se o repositório está inicializado
3. Verificar se há erros de parsing

### Problema: Exportação Excel falha

1. Verificar se ExcelJS está instalado
2. Verificar memória disponível
3. Reduzir quantidade de atividades exportadas por vez
