// Value Object para representar uma data
export class DateVO {
  private constructor(private readonly _date: Date) {
    this.validate();
  }

  static fromDate(date: Date): DateVO {
    return new DateVO(new Date(date));
  }

  static fromString(dateString: string): DateVO {
    const date = new Date(dateString);
    return new DateVO(date);
  }

  static fromISO(isoString: string): DateVO {
    return new DateVO(new Date(isoString));
  }

  static today(): DateVO {
    return new DateVO(new Date());
  }

  private validate(): void {
    if (isNaN(this._date.getTime())) {
      throw new Error('Invalid date');
    }
  }

  get value(): Date {
    return new Date(this._date);
  }

  toISOString(): string {
    return this._date.toISOString().split('T')[0];
  }

  toLocaleDateString(): string {
    return this._date.toLocaleDateString('pt-BR');
  }

  format(format: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'ISO' = 'YYYY-MM-DD'): string {
    const year = this._date.getFullYear();
    const month = String(this._date.getMonth() + 1).padStart(2, '0');
    const day = String(this._date.getDate()).padStart(2, '0');

    switch (format) {
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'ISO':
        return this._date.toISOString();
      default:
        return `${year}-${month}-${day}`;
    }
  }

  isBefore(other: DateVO): boolean {
    return this._date < other._date;
  }

  isAfter(other: DateVO): boolean {
    return this._date > other._date;
  }

  equals(other: DateVO): boolean {
    return this._date.getTime() === other._date.getTime();
  }

  getDayOfWeek(): number {
    return this._date.getDay();
  }

  isWeekend(): boolean {
    const day = this.getDayOfWeek();
    return day === 0 || day === 6;
  }
}
