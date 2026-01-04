import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';
import { EpactSource } from '../models/epact';
import { db, EpactState } from '../db/lunava.db';

const EPACT_URL = 'https://etordev.github.io/lunava/epact.json';

@Injectable({ providedIn: 'root' })
export class EpactService {

  constructor(private http: HttpClient) {}

  async syncEpact(): Promise<EpactState> {
    const state = await this.ensureEpact();
    const now = new Date();

    const updated = this.calculateEpactFrom(
      state.epact,
      state.lastMarchYear,
      now
    );

    const finalState: EpactState = {
      ...state,
      ...updated
    };

    await db.epact.put(finalState);
    return finalState;
  }

  async ensureEpact(): Promise<EpactState> {
    let state = await db.epact.get('epact');

    if (!state) {
      const official = await this.loadOfficialEpact();
      state = {
        id: 'epact',
        ...official
      };
      await db.epact.put(state);
    }

    return state;
  }

  async loadOfficialEpact(): Promise<EpactSource> {
    return await firstValueFrom(
      this.http.get<EpactSource>(EPACT_URL)
    );
  }

  advanceEpact(epact: number): number {
    return ((epact + 11 - 1) % 30) + 1;
  }

  calculateEpactFrom(
    baseEpact: number,
    baseMarchYear: number,
    now: Date
  ): { epact: number; lastMarchYear: number } {

    let epact = baseEpact;
    let year = baseMarchYear;

    // aggiorna per ogni marzo passato
    while (
      year < now.getFullYear() ||
      (year === now.getFullYear() && now.getMonth() >= 2)
    ) {
      year++;
      epact = this.advanceEpact(epact);
    }

    return { epact, lastMarchYear: year };
  }

  async getCurrentEpact(): Promise<number> {
    const state = await this.syncEpact();
    return state.epact;
  }
}
