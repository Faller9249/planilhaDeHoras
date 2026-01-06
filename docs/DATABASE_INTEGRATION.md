# Guia de Integração com Banco de Dados

## Visão Geral

Este guia demonstra como integrar a aplicação com um banco de dados (PostgreSQL, MySQL, MongoDB, etc) mantendo a arquitetura limpa existente.

## Opção 1: PostgreSQL com Prisma ORM

### 1. Instalação

```bash
npm install @prisma/client
npm install -D prisma
```

### 2. Inicialização do Prisma

```bash
npx prisma init
```

### 3. Schema do Prisma

Criar/editar `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String      @id @default(uuid())
  email        String      @unique
  name         String
  password     String
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
  activities   Activity[]
}

model Activity {
  id           String      @id @default(uuid())
  date         DateTime
  startTime    String
  duration     String
  task         String
  collaborator String
  userId       String?
  user         User?       @relation(fields: [userId], references: [id])
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  @@index([date])
  @@index([userId])
}
```

### 4. Configurar Variável de Ambiente

`.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/activities_db?schema=public"
```

### 5. Criar Migration

```bash
npx prisma migrate dev --name init
```

### 6. Implementar Repositório com Prisma

Criar `src/infrastructure/repositories/PrismaActivityRepository.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import { Activity } from '../../domain/entities/Activity';
import { IActivityRepository } from '../../domain/repositories/IActivityRepository';

export class PrismaActivityRepository implements IActivityRepository {
  constructor(private prisma: PrismaClient) {}

  async save(activity: Activity): Promise<void> {
    await this.prisma.activity.create({
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

  async saveMany(activities: Activity[]): Promise<void> {
    await this.prisma.activity.createMany({
      data: activities.map(a => ({
        id: a.id,
        date: a.date,
        startTime: a.startTime,
        duration: a.duration,
        task: a.task,
        collaborator: a.collaborator
      }))
    });
  }

  async findById(id: string): Promise<Activity | null> {
    const record = await this.prisma.activity.findUnique({
      where: { id }
    });

    if (!record) return null;

    return Activity.reconstruct({
      id: record.id,
      date: record.date,
      startTime: record.startTime,
      duration: record.duration,
      task: record.task,
      collaborator: record.collaborator
    });
  }

  async findAll(): Promise<Activity[]> {
    const records = await this.prisma.activity.findMany({
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
    });

    return records.map(r => Activity.reconstruct({
      id: r.id,
      date: r.date,
      startTime: r.startTime,
      duration: r.duration,
      task: r.task,
      collaborator: r.collaborator
    }));
  }

  async update(activity: Activity): Promise<void> {
    await this.prisma.activity.update({
      where: { id: activity.id },
      data: {
        date: activity.date,
        startTime: activity.startTime,
        duration: activity.duration,
        task: activity.task,
        collaborator: activity.collaborator
      }
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.activity.delete({
      where: { id }
    });
  }

  async deleteAll(): Promise<void> {
    await this.prisma.activity.deleteMany();
  }

  async findByDate(date: Date): Promise<Activity[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const records = await this.prisma.activity.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      orderBy: { startTime: 'asc' }
    });

    return records.map(r => Activity.reconstruct({
      id: r.id,
      date: r.date,
      startTime: r.startTime,
      duration: r.duration,
      task: r.task,
      collaborator: r.collaborator
    }));
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Activity[]> {
    const records = await this.prisma.activity.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
    });

    return records.map(r => Activity.reconstruct({
      id: r.id,
      date: r.date,
      startTime: r.startTime,
      duration: r.duration,
      task: r.task,
      collaborator: r.collaborator
    }));
  }

  async findByCollaborator(collaborator: string): Promise<Activity[]> {
    const records = await this.prisma.activity.findMany({
      where: { collaborator },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
    });

    return records.map(r => Activity.reconstruct({
      id: r.id,
      date: r.date,
      startTime: r.startTime,
      duration: r.duration,
      task: r.task,
      collaborator: r.collaborator
    }));
  }

  async findByTaskDescription(searchTerm: string): Promise<Activity[]> {
    const records = await this.prisma.activity.findMany({
      where: {
        task: {
          contains: searchTerm,
          mode: 'insensitive'
        }
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
    });

    return records.map(r => Activity.reconstruct({
      id: r.id,
      date: r.date,
      startTime: r.startTime,
      duration: r.duration,
      task: r.task,
      collaborator: r.collaborator
    }));
  }

  async getTotalActivities(): Promise<number> {
    return await this.prisma.activity.count();
  }

  async getTotalHoursByDate(date: Date): Promise<number> {
    const activities = await this.findByDate(date);
    return activities.reduce((total, activity) => {
      return total + activity.getDurationInMinutes();
    }, 0);
  }

  async getTotalHoursByDateRange(startDate: Date, endDate: Date): Promise<number> {
    const activities = await this.findByDateRange(startDate, endDate);
    return activities.reduce((total, activity) => {
      return total + activity.getDurationInMinutes();
    }, 0);
  }

  async getUniqueDates(): Promise<Date[]> {
    const result = await this.prisma.activity.findMany({
      select: { date: true },
      distinct: ['date'],
      orderBy: { date: 'asc' }
    });

    return result.map(r => r.date);
  }
}
```

### 7. Atualizar DependencyContainer

Editar `src/infrastructure/DependencyContainer.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import { PrismaActivityRepository } from './repositories/PrismaActivityRepository';
// ... outros imports

export class DependencyContainer {
  private static instance: DependencyContainer;

  // Escolher implementação via variável de ambiente
  private readonly usePrisma = import.meta.env.VITE_USE_DATABASE === 'true';
  private readonly prisma = this.usePrisma ? new PrismaClient() : null;

  // Repositórios
  private readonly activityRepository = this.usePrisma && this.prisma
    ? new PrismaActivityRepository(this.prisma)
    : new InMemoryActivityRepository();

  // ... resto do código permanece igual
}
```

### 8. Configurar Variável de Ambiente no Vite

`.env.local`:
```
VITE_USE_DATABASE=true
DATABASE_URL="postgresql://user:password@localhost:5432/activities_db"
```

## Opção 2: MongoDB com Mongoose

### 1. Instalação

```bash
npm install mongoose
```

### 2. Schema do Mongoose

Criar `src/infrastructure/database/schemas/ActivitySchema.ts`:

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityDocument extends Document {
  id: string;
  date: Date;
  startTime: string;
  duration: string;
  task: string;
  collaborator: string;
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema = new Schema<IActivityDocument>(
  {
    id: { type: String, required: true, unique: true },
    date: { type: Date, required: true, index: true },
    startTime: { type: String, required: true },
    duration: { type: String, required: true },
    task: { type: String, required: true },
    collaborator: { type: String, required: true, index: true }
  },
  {
    timestamps: true
  }
);

export const ActivityModel = mongoose.model<IActivityDocument>('Activity', ActivitySchema);
```

### 3. Implementar Repositório com Mongoose

Criar `src/infrastructure/repositories/MongoActivityRepository.ts`:

```typescript
import mongoose from 'mongoose';
import { Activity } from '../../domain/entities/Activity';
import { IActivityRepository } from '../../domain/repositories/IActivityRepository';
import { ActivityModel } from '../database/schemas/ActivitySchema';

export class MongoActivityRepository implements IActivityRepository {
  constructor(private connectionString: string) {
    this.connect();
  }

  private async connect() {
    await mongoose.connect(this.connectionString);
  }

  async save(activity: Activity): Promise<void> {
    await ActivityModel.create({
      id: activity.id,
      date: activity.date,
      startTime: activity.startTime,
      duration: activity.duration,
      task: activity.task,
      collaborator: activity.collaborator
    });
  }

  async saveMany(activities: Activity[]): Promise<void> {
    await ActivityModel.insertMany(
      activities.map(a => ({
        id: a.id,
        date: a.date,
        startTime: a.startTime,
        duration: a.duration,
        task: a.task,
        collaborator: a.collaborator
      }))
    );
  }

  async findById(id: string): Promise<Activity | null> {
    const doc = await ActivityModel.findOne({ id });

    if (!doc) return null;

    return Activity.reconstruct({
      id: doc.id,
      date: doc.date,
      startTime: doc.startTime,
      duration: doc.duration,
      task: doc.task,
      collaborator: doc.collaborator
    });
  }

  async findAll(): Promise<Activity[]> {
    const docs = await ActivityModel.find().sort({ date: 1, startTime: 1 });

    return docs.map(doc => Activity.reconstruct({
      id: doc.id,
      date: doc.date,
      startTime: doc.startTime,
      duration: doc.duration,
      task: doc.task,
      collaborator: doc.collaborator
    }));
  }

  // ... implementar outros métodos seguindo o mesmo padrão
}
```

## Opção 3: API REST

Para aplicações que precisam de um backend separado:

### 1. Criar API Adapter

Criar `src/infrastructure/adapters/RestAPIActivityRepository.ts`:

```typescript
import { Activity } from '../../domain/entities/Activity';
import { IActivityRepository } from '../../domain/repositories/IActivityRepository';

export class RestAPIActivityRepository implements IActivityRepository {
  constructor(private baseURL: string) {}

  async save(activity: Activity): Promise<void> {
    await fetch(`${this.baseURL}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activity.toJSON())
    });
  }

  async findAll(): Promise<Activity[]> {
    const response = await fetch(`${this.baseURL}/activities`);
    const data = await response.json();

    return data.map((item: any) => Activity.reconstruct({
      id: item.id,
      date: new Date(item.date),
      startTime: item.startTime,
      duration: item.duration,
      task: item.task,
      collaborator: item.collaborator
    }));
  }

  // ... outros métodos
}
```

## Migration de Dados

Script para migrar dados do LocalStorage para banco:

```typescript
// scripts/migrate-to-database.ts
import { InMemoryActivityRepository } from '../src/infrastructure/repositories/InMemoryActivityRepository';
import { PrismaActivityRepository } from '../src/infrastructure/repositories/PrismaActivityRepository';
import { PrismaClient } from '@prisma/client';

async function migrate() {
  const prisma = new PrismaClient();
  const sourceRepo = new InMemoryActivityRepository();
  const targetRepo = new PrismaActivityRepository(prisma);

  console.log('Carregando dados do LocalStorage...');
  const activities = await sourceRepo.findAll();

  console.log(`Encontradas ${activities.length} atividades`);
  console.log('Migrando para banco de dados...');

  await targetRepo.saveMany(activities);

  console.log('✓ Migração concluída!');
  await prisma.$disconnect();
}

migrate().catch(console.error);
```

## Testes com Banco de Dados

### Testes de Integração

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PrismaActivityRepository } from '../infrastructure/repositories/PrismaActivityRepository';
import { Activity } from '../domain/entities/Activity';

describe('PrismaActivityRepository Integration Tests', () => {
  let prisma: PrismaClient;
  let repository: PrismaActivityRepository;

  beforeEach(async () => {
    prisma = new PrismaClient();
    repository = new PrismaActivityRepository(prisma);
    // Limpar banco antes de cada teste
    await prisma.activity.deleteMany();
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  it('should save and retrieve an activity', async () => {
    const activity = Activity.create({
      date: new Date('2025-09-01'),
      startTime: '8:00',
      duration: '1:00',
      task: 'Test Task',
      collaborator: 'John Doe'
    });

    await repository.save(activity);

    const retrieved = await repository.findById(activity.id);

    expect(retrieved).not.toBeNull();
    expect(retrieved?.task).toBe('Test Task');
  });

  it('should find activities by date', async () => {
    const date = new Date('2025-09-01');

    const activity1 = Activity.create({
      date,
      startTime: '8:00',
      duration: '1:00',
      task: 'Task 1',
      collaborator: 'John'
    });

    const activity2 = Activity.create({
      date,
      startTime: '9:00',
      duration: '1:00',
      task: 'Task 2',
      collaborator: 'John'
    });

    await repository.saveMany([activity1, activity2]);

    const results = await repository.findByDate(date);

    expect(results).toHaveLength(2);
  });
});
```

## Checklist de Integração

- [ ] Escolher banco de dados (PostgreSQL, MongoDB, etc)
- [ ] Instalar dependências necessárias
- [ ] Criar schema/models
- [ ] Implementar repositório específico
- [ ] Atualizar DependencyContainer
- [ ] Configurar variáveis de ambiente
- [ ] Migrar dados existentes (se necessário)
- [ ] Escrever testes de integração
- [ ] Atualizar documentação
- [ ] Deploy e monitoramento

## Benefícios da Arquitetura Atual

1. **Zero mudanças no domínio**: Lógica de negócio permanece intacta
2. **Zero mudanças nos use cases**: Casos de uso são agnósticos à persistência
3. **Zero mudanças na apresentação**: UI não sabe sobre banco de dados
4. **Troca transparente**: Basta mudar o repositório no container
5. **Testabilidade mantida**: Cada camada continua testável isoladamente
