import { Injectable } from '@angular/core';
import { db, LunavaState } from '../db/lunava.db';

@Injectable({ providedIn: 'root' })
export class LunavaService {

  async loadState(): Promise<LunavaState> {
    let state = await db.state.get('current');
    if (!state) {
      state = { id: 'current', patta: 29, lastMarchYear: new Date().getFullYear() - 1 };
      await db.state.put(state);
    }
    return state;
  }

  async updateMarchIfNeeded() {
    const now = new Date();
    const state = await this.loadState();

    if (now.getMonth() === 2 && now.getFullYear() > state.lastMarchYear) {
      let p = state.patta + 11;
      if (p > 30) p -= 30;
      state.patta = p;
      state.lastMarchYear = now.getFullYear();
      await db.state.put(state);
    }
  }

  calcLunarDay(patta: number, m: number, d: number): number {
    let t = patta + m + d;

    // normalizzazione corretta 1–30
    t = ((t - 1) % 30) + 1;

    return t;
  }

  phase(g: number): 'growing' | 'full' | 'waning' {
    if (g === 15) return 'full';
    return g < 15 ? 'growing' : 'waning';
  }
}
