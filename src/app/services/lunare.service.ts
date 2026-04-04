import { Injectable } from '@angular/core';

export type LunarDayMarker = 'new' | 'full' | 'half';

@Injectable({ providedIn: 'root' })
export class LunareService {

  calcLunarDay(epact: number, month: number, day: number): number {
    let t = epact + month + day;

    t = ((t - 1) % 30) + 1;

    return t;
  }

  phase(lunarDay: number): 'growing' | 'full' | 'waning' {
    if (lunarDay === 14) return 'full';
    return lunarDay < 14 ? 'growing' : 'waning';
  }

  /**
   * Highlights in the month grid: new moon (dark), full moon, half moons (quarters)
   * in the 30-day traditional count (days 1 & 30 new, 7 & 22 half, 14 full).
   */
  lunarDayMarker(lunarDay: number): LunarDayMarker | null {
    if (lunarDay === 1 || lunarDay === 30) return 'new';
    if (lunarDay === 14) return 'full';
    if (lunarDay === 7 || lunarDay === 22) return 'half';
    return null;
  }
}
