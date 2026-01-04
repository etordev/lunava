import Dexie, { Table } from 'dexie';

export interface LunavaState {
  id: 'current';
  epact: number;
  lastMarchYear: number;
}

export interface LunavaHistory {
  id?: number;
  date: string; // YYYY-MM-DD
  year: number;
  monthFromMarch: number;
  day: number;
  epact: number;
  lunarDay: number;
  phase: 'growing' | 'full' | 'waning';
}

export interface EpactState {
  id: 'epact';
  epact: number;
  lastMarchYear: number;
  authority: string;
  description: string;
}

export class LunavaDB extends Dexie {
  state!: Table<LunavaState, string>;
  history!: Table<LunavaHistory, number>;
  epact!: Table<EpactState, 'epact'>;

  constructor() {
    super('lunava-db');
    this.version(2).stores({
      state: 'id',
      epact: 'id'
    });
  }
}

export const db = new LunavaDB();
