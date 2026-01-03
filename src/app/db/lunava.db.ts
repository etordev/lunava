import Dexie, { Table } from 'dexie';

export interface LunavaState {
  id: 'current';
  patta: number;
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

export class LunavaDB extends Dexie {
  state!: Table<LunavaState, string>;
  history!: Table<LunavaHistory, number>;

  constructor() {
    super('lunava-db');
    this.version(1).stores({
      state: 'id',
      history: '++id,date,year'
    });
  }
}

export const db = new LunavaDB();
