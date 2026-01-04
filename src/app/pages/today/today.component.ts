import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { LunavaService } from '../../services/lunava.service';
import { CommonModule } from '@angular/common';
import { EpactService } from '../../services/epact.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CdkMenuModule } from '@angular/cdk/menu';
import { AVAILABLE_LANGUAGES } from './today.config';

@Component({
  selector: 'app-today',
   imports: [CommonModule, TranslateModule, CdkMenuModule],
  templateUrl: './today.component.html'
})
export class TodayComponent implements OnInit {
  lunarDay = 0;
  phase = '';
  epact = 0;
  today = new Date();
  phaseLabel = '';
  shadowX = 100;
  moonScale = 1;
  shadowOffset = 0;
  languages = AVAILABLE_LANGUAGES;
  currentLang = 'en';

  constructor(private lunava: LunavaService,
              private translate: TranslateService,
              private epactService: EpactService,
              private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.initLang();
    this.initData();
  }

  initLang() {
    this.currentLang = this.translate.currentLang || 'en';
  }

  setLang(lang: string) {
    this.translate.use(lang);
    this.currentLang = lang;
  }

  async initData() {
    await this.setLunavaData();
    this.updateMoonShadow();
    this.updateMoonScale();
    this.cdr.detectChanges();
  }

  async setLunavaData() {
    this.epact = await this.epactService.getCurrentEpact();
    console.log('Current epact:', this.epact);
    const today = new Date();
    const m = (today.getMonth() + 10) % 12 + 1;
    const d = today.getDate();

    this.lunarDay = this.lunava.calcLunarDay(this.epact, m, d);

    if (this.lunarDay < 1 || this.lunarDay > 30) {
      console.warn('Invalid lunar day:', this.lunarDay);
      this.lunarDay = 1;
    }

    this.phase = this.lunava.phase(this.lunarDay);
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
