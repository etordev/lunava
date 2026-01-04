import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LunavaService {

  calcLunarDay(epact: number, month: number, day: number): number {
    let t = epact + month + day;

    t = ((t - 1) % 30) + 1;

    return t;
  }

  phase(lunarDay: number): 'growing' | 'full' | 'waning' {
    if (lunarDay === 15) return 'full';
    return lunarDay < 15 ? 'growing' : 'waning';
  }
}
