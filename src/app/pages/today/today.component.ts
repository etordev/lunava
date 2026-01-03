import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { LunavaService } from '../../services/lunava.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-today',
   imports: [CommonModule],
  templateUrl: './today.component.html'
})
export class TodayComponent implements OnInit {
  lunarDay = 0;
  phase = '';
  patta = 0;
  today = new Date();
  phaseLabel = '';
  shadowX = 100;
  moonScale = 1;
  shadowOffset = 0;

  constructor(private lunava: LunavaService,
              private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.initData();
  }

  async initData() {
    await this.setLunavaData();
    this.updateMoonShadow();
    this.updateMoonScale();
    this.cdr.detectChanges();
  }

  async setLunavaData() {
    await this.lunava.updateMarchIfNeeded();
    const state = await this.lunava.loadState();

    const today = new Date();
    const m = (today.getMonth() + 10) % 12 + 1;
    const d = today.getDate();

    console.log('STATE FROM DB:', state);
    console.log('m,d:', m, d);

    this.patta = state.patta;

    const calc = this.lunava.calcLunarDay(state.patta, m, d);
    console.log('CALC RESULT:', calc);

    this.lunarDay = calc;

    if (this.lunarDay < 1 || this.lunarDay > 30) {
      console.warn('Invalid lunar day:', this.lunarDay);
      this.lunarDay = 1;
    }

    this.phase = this.lunava.phase(this.lunarDay);
  }

  async save() {
    console.log('Saving today...');
    // per ora vuoto, lo useremo tra poco
  }

  updateMoonShadow() {
    const progress = (this.lunarDay - 15) / 15;
    // da -1 a +1

     // spostamento ombra (in px)
    this.shadowOffset = progress * 120;
  }

  updateMoonScale() {
    const distance = Math.abs(this.lunarDay - 15);
    const normalized = 1 - distance / 15;

    // più evidente
    this.moonScale = 0.6 + normalized * 0.6;
  }
}
