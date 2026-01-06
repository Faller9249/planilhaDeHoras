// Entidade principal do domínio: Atividade
export class Activity {
  private constructor(
    private readonly _id: string,
    private _date: Date,
    private _startTime: string,
    private _duration: string,
    private _task: string,
    private _collaborator: string,
    private _validationWarnings: string[] = [],
    private _hasValidationIssues: boolean = false
  ) {}

  // Factory method para criar uma atividade
  static create(params: {
    date: Date;
    startTime: string;
    duration: string;
    task: string;
    collaborator: string;
    validationWarnings?: string[];
    hasValidationIssues?: boolean;
  }): Activity {
    const id = crypto.randomUUID();
    console.log('\n🏗️  [Activity.create] Criando nova atividade:');
    console.log(`   🆔 ID: ${id}`);
    console.log(`   📅 Data: ${params.date.toISOString()}`);
    console.log(`   ⏰ Hora Início: ${params.startTime}`);
    console.log(`   ⏱️  Duração: ${params.duration}`);
    console.log(`   📝 Tarefa: ${params.task}`);
    console.log(`   👤 Colaborador: ${params.collaborator}`);
    if (params.validationWarnings && params.validationWarnings.length > 0) {
      console.log(`   ⚠️  Avisos: ${params.validationWarnings.join(', ')}`);
    }

    const activity = new Activity(
      id,
      params.date,
      params.startTime,
      params.duration,
      params.task,
      params.collaborator,
      params.validationWarnings || [],
      params.hasValidationIssues || false
    );

    console.log(`   ✅ Activity criada com sucesso! Hora fim: ${activity.calculateEndTime()}`);
    return activity;
  }

  // Factory method para reconstruir uma atividade existente
  static reconstruct(params: {
    id: string;
    date: Date;
    startTime: string;
    duration: string;
    task: string;
    collaborator: string;
    validationWarnings?: string[];
    hasValidationIssues?: boolean;
  }): Activity {
    return new Activity(
      params.id,
      params.date,
      params.startTime,
      params.duration,
      params.task,
      params.collaborator,
      params.validationWarnings || [],
      params.hasValidationIssues || false
    );
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get date(): Date {
    return this._date;
  }

  get startTime(): string {
    return this._startTime;
  }

  get duration(): string {
    return this._duration;
  }

  get task(): string {
    return this._task;
  }

  get collaborator(): string {
    return this._collaborator;
  }

  get validationWarnings(): string[] {
    return this._validationWarnings;
  }

  get hasValidationIssues(): boolean {
    return this._hasValidationIssues;
  }

  // Métodos de negócio
  calculateEndTime(): string {
    const [startHours, startMinutes] = this._startTime.split(':').map(Number);
    const [durationHours, durationMinutes] = this._duration.split(':').map(Number);

    const totalMinutes = (startHours * 60 + startMinutes) + (durationHours * 60 + durationMinutes);
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;

    return `${endHours}:${endMinutes.toString().padStart(2, '0')}`;
  }

  getDurationInMinutes(): number {
    const [hours, minutes] = this._duration.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Setters com validação
  updateTask(newTask: string): void {
    if (!newTask || newTask.trim().length === 0) {
      throw new Error('Task cannot be empty');
    }
    this._task = newTask.trim();
  }

  updateDuration(newDuration: string): void {
    if (!this.isValidTimeFormat(newDuration)) {
      throw new Error('Invalid duration format. Expected HH:MM');
    }
    this._duration = newDuration;
  }

  private isValidTimeFormat(time: string): boolean {
    return /^\d{1,2}:\d{2}$/.test(time);
  }

  // Método para adicionar avisos de validação
  addValidationWarning(warning: string): void {
    this._validationWarnings.push(warning);
    this._hasValidationIssues = true;
  }

  // Conversão para objeto simples (útil para serialização)
  toJSON() {
    return {
      id: this._id,
      date: this._date.toISOString(),
      startTime: this._startTime,
      duration: this._duration,
      task: this._task,
      collaborator: this._collaborator,
      endTime: this.calculateEndTime(),
      durationInMinutes: this.getDurationInMinutes(),
      validationWarnings: this._validationWarnings,
      hasValidationIssues: this._hasValidationIssues
    };
  }
}
