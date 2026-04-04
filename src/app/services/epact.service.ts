import { Injectable } from '@angular/core';
import { EPACT_URL } from '../constants/epact';

/**
 * Epact is a collective, objective lunar value.
 * It is loaded from a public JSON source and
 * deterministically updated over time.
 */

@Injectable({ providedIn: 'root' })
export class EpactService {

  /**
   * Returns the current epact value (same rules as {@link getEpactForDate} for “now”).
   */
  async getCurrentEpact(): Promise<number> {
    return this.getEpactForDate(new Date());
  }

  /**
   * Epact for the lunar year that contains the given calendar date.
   */
  getEpactForDateSync(date: Date): number {
    const official = EPACT_URL;
    return this.calculateEpactFrom(
      official.epact,
      official.lastMarchYear,
      date
    ).epact;
  }

  async getEpactForDate(date: Date): Promise<number> {
    return this.getEpactForDateSync(date);
  }

  /**
   * Advances the epact by one lunar year (+11 mod 30).
   */
  private advanceEpact(epact: number): number {
    return ((epact + 11 - 1) % 30) + 1;
  }

  /** Inverse of {@link advanceEpact} for years before the base year. */
  private retreatEpact(epact: number): number {
    const e = epact - 11;
    return e < 1 ? e + 30 : e;
  }

  /**
   * Calculates the epact value starting from a base year,
   * advancing or retreating at each March boundary.
   */
  private calculateEpactFrom(
    baseEpact: number,
    baseMarchYear: number,
    target: Date
  ): { epact: number; lastMarchYear: number } {
    let epact = baseEpact;
    const currentYear = target.getFullYear();
    const isAfterMarch = target.getMonth() >= 2;

    if (currentYear === baseMarchYear) {
      return { epact, lastMarchYear: baseMarchYear };
    }

    if (currentYear < baseMarchYear) {
      for (let y = baseMarchYear; y > currentYear; y--) {
        epact = this.retreatEpact(epact);
      }
      if (!isAfterMarch) {
        epact = this.retreatEpact(epact);
      }
      return { epact, lastMarchYear: currentYear };
    }

    let year = baseMarchYear;
    for (let y = baseMarchYear + 1; y <= currentYear; y++) {
      if (y === currentYear && !isAfterMarch) {
        break;
      }
      epact = this.advanceEpact(epact);
      year = y;
    }

    return { epact, lastMarchYear: year };
  }
}
