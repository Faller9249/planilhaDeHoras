// Value Object para representar os horários de um dia de trabalho
export class DaySchedule {
  private constructor(
    private readonly _date: string, // YYYY-MM-DD
    private readonly _startTime: string | null,
    private readonly _lunchTime: string | null,
    private readonly _returnTime: string | null,
    private readonly _endTime: string | null
  ) {}

  static create(params: {
    date: string;
    startTime?: string | null;
    lunchTime?: string | null;
    returnTime?: string | null;
    endTime?: string | null;
  }): DaySchedule {
    return new DaySchedule(
      params.date,
      params.startTime || null,
      params.lunchTime || null,
      params.returnTime || null,
      params.endTime || null
    );
  }

  get date(): string {
    return this._date;
  }

  get startTime(): string | null {
    return this._startTime;
  }

  get lunchTime(): string | null {
    return this._lunchTime;
  }

  get returnTime(): string | null {
    return this._returnTime;
  }

  get endTime(): string | null {
    return this._endTime;
  }

  // Calcula duração da manhã (início até almoço)
  getMorningDuration(): string | null {
    if (!this._startTime || !this._lunchTime) return null;
    return this.calculateDuration(this._startTime, this._lunchTime);
  }

  // Calcula duração da tarde (retorno até final)
  getAfternoonDuration(): string | null {
    if (!this._returnTime || !this._endTime) return null;
    return this.calculateDuration(this._returnTime, this._endTime);
  }

  // Calcula duração total do dia
  getTotalDuration(): string | null {
    const morning = this.getMorningDuration();
    const afternoon = this.getAfternoonDuration();

    if (!morning && !afternoon) return null;
    if (!morning) return afternoon;
    if (!afternoon) return morning;

    const morningMinutes = this.timeToMinutes(morning);
    const afternoonMinutes = this.timeToMinutes(afternoon);
    const totalMinutes = morningMinutes + afternoonMinutes;

    return this.minutesToTime(totalMinutes);
  }

  private calculateDuration(start: string, end: string): string {
    const startMinutes = this.timeToMinutes(start);
    const endMinutes = this.timeToMinutes(end);
    const durationMinutes = endMinutes - startMinutes;
    return this.minutesToTime(durationMinutes);
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

  toJSON() {
    return {
      date: this._date,
      startTime: this._startTime,
      lunchTime: this._lunchTime,
      returnTime: this._returnTime,
      endTime: this._endTime,
      morningDuration: this.getMorningDuration(),
      afternoonDuration: this.getAfternoonDuration(),
      totalDuration: this.getTotalDuration()
    };
  }
}
