// Value Object para representar um intervalo de tempo
export class TimeRange {
  private constructor(
    private readonly _startTime: string,
    private readonly _endTime: string
  ) {
    this.validate();
  }

  static create(startTime: string, endTime: string): TimeRange {
    return new TimeRange(startTime, endTime);
  }

  private validate(): void {
    if (!this.isValidTimeFormat(this._startTime)) {
      throw new Error(`Invalid start time format: ${this._startTime}`);
    }
    if (!this.isValidTimeFormat(this._endTime)) {
      throw new Error(`Invalid end time format: ${this._endTime}`);
    }
    if (this.getStartMinutes() >= this.getEndMinutes()) {
      throw new Error('Start time must be before end time');
    }
  }

  private isValidTimeFormat(time: string): boolean {
    return /^\d{1,2}:\d{2}$/.test(time);
  }

  get startTime(): string {
    return this._startTime;
  }

  get endTime(): string {
    return this._endTime;
  }

  private getStartMinutes(): number {
    return this.timeToMinutes(this._startTime);
  }

  private getEndMinutes(): number {
    return this.timeToMinutes(this._endTime);
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  getDurationInMinutes(): number {
    return this.getEndMinutes() - this.getStartMinutes();
  }

  getDurationFormatted(): string {
    const minutes = this.getDurationInMinutes();
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  }

  equals(other: TimeRange): boolean {
    return this._startTime === other._startTime && this._endTime === other._endTime;
  }
}
