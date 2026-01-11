import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { EpactSource } from '../models/epact';
import { db, EpactState } from '../db/lunare.db';

/**
 * Epact is a collective, objective lunar value.
 * It is loaded from a public JSON source and
 * deterministically updated over time.
 */
const EPACT_URL = '/epact.json';

@Injectable({ providedIn: 'root' })
export class EpactService {

  constructor(private http: HttpClient) {}

  /**
   * Returns the current epact value.
   * Ensures local persistence and automatic March updates.
   */
  async getCurrentEpact(): Promise<number> {
    const state = await this.ensureEpact();
    return state.epact;
  }

  /**
   * Loads the local epact state or initializes it
   * from the official public source if missing.
   */
  private async ensureEpact(): Promise<EpactState> {
    const official = await this.loadOfficialEpact();
    const now = new Date();

    // ricalcolo SEMPRE partendo dalla fonte ufficiale
    const recalculated = this.calculateEpactFrom(
      official.epact,
      official.lastMarchYear,
      now
    );
    console.log('recalculated epact', recalculated);
    const state: EpactState = {
      id: 'epact',
      ...official,
      ...recalculated
    };

    // sovrascrive sempre: il DB è solo cache
    await db.epact.put(state);

    return state;
  }

  /**
   * Loads the official epact definition from the JSON.
   * This is the only external source of truth.
   */
  private async loadOfficialEpact(): Promise<EpactSource> {
    return firstValueFrom(
      this.http.get<EpactSource>(EPACT_URL)
    );
  }

  /**
   * Advances the epact by one lunar year (+11 mod 30).
   */
  private advanceEpact(epact: number): number {
    return ((epact + 11 - 1) % 30) + 1;
  }

  /**
   * Calculates the epact value starting from a base year,
   * advancing it for each March that has passed.
   */
  private calculateEpactFrom(
    baseEpact: number,
    baseMarchYear: number,
    now: Date
    ): { epact: number; lastMarchYear: number } {

    let epact = baseEpact;
    let year = baseMarchYear;

    const currentYear = now.getFullYear();
    const isAfterMarch = now.getMonth() >= 2; // marzo = 2

    // Caso 1: stesso anno della base → nessun avanzamento
    if (currentYear === baseMarchYear) {
      return { epact, lastMarchYear: year };
    }

    // Caso 2: anni successivi
    for (let y = baseMarchYear + 1; y <= currentYear; y++) {
      // per l’anno corrente, avanza solo se siamo da marzo in poi
      if (y === currentYear && !isAfterMarch) {
        break;
      }

      epact = this.advanceEpact(epact);
      year = y;
    }

    return { epact, lastMarchYear: year };
  }
}
