import Dexie, { Table } from 'dexie';

export interface LunareState {
  id: 'current';
  epact: number;
  lastMarchYear: number;
}

export interface LunareHistory {
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

export class LunareDB extends Dexie {
  state!: Table<LunareState, string>;
  history!: Table<LunareHistory, number>;
  epact!: Table<EpactState, 'epact'>;
  preferences!: Table<{
    id: 'lang';
    value: string;
  }>;

  constructor() {
    super('lunare-db');
    this.version(2).stores({
      state: 'id',
      epact: 'id',
      preferences: 'id'
    });
  }
}

export const db = new LunareDB();


