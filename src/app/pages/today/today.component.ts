import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { LunareService } from '../../services/lunare.service';
import { CommonModule } from '@angular/common';
import { EpactService } from '../../services/epact.service';
import { LangChangeEvent, TranslateModule, TranslateService } from '@ngx-translate/core';
import { CdkMenuModule } from '@angular/cdk/menu';
import { AVAILABLE_LANGUAGES, DEFAULT_LANG } from '../../constants/lang';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-today',
   imports: [CommonModule, TranslateModule, CdkMenuModule],
  templateUrl: './today.component.html'
})

export class TodayComponent implements OnInit, OnDestroy {
  private lastComputedDate = new Date().toDateString();
  private dayCheckTimer?: number;
  lunarDay = 0;
  phase = '';
  epact = 0;
  today = new Date();
  phaseLabel = '';
  shadowX = 100;
  moonScale = 1;
  shadowOffset = 0;
  languages = AVAILABLE_LANGUAGES;
  currentLang = DEFAULT_LANG;
  formattedDate = '';
  lunarDayLabel = 'LunarDayLabel';

  constructor(private _lunareService: LunareService,
              private _translateService: TranslateService,
              private _languageService: LanguageService, 
              private _epactService: EpactService,
              private _cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.initLang();
    this.initData();
    this.startDayWatcher();
  }

  startDayWatcher() {
    this.dayCheckTimer = window.setInterval(async () => {
    const todayString = new Date().toDateString();

    if (todayString !== this.lastComputedDate) {
      this.lastComputedDate = todayString;

      await this.initData();
      this._cdr.detectChanges();
     }
    }, 60_000);
  }

  initLang() {
    this._translateService.onLangChange.subscribe(
      (event: LangChangeEvent) => {
        this.currentLang = event.lang;
        this.updateFormattedDate(event.lang);
        console.log('lang changed →', this.currentLang);
        this._cdr.detectChanges();
      }
    );
    const lang = this._translateService.currentLang || DEFAULT_LANG;
    this.updateFormattedDate(lang);
  }

  setLang(lang: string) {
    console.log('set lang');
    this._languageService.set(lang);
    this.currentLang = lang;
  }

  async initData() {
    await this.setLunareData();
    this.updateMoonShadow();
    this.updateMoonScale();
    this._cdr.detectChanges();
  }

  async setLunareData() {
    this.epact = await this._epactService.getCurrentEpact();
    console.log('Current epact:', this.epact);
    const today = new Date();
    const m = (today.getMonth() + 10) % 12 + 1;
    const d = today.getDate();

    this.lunarDay = this._lunareService.calcLunarDay(this.epact, m, d);

    if (this.lunarDay < 1 || this.lunarDay > 30) {
      console.warn('Invalid lunar day:', this.lunarDay);
      this.lunarDay = 1;
    }

    this.phase = this._lunareService.phase(this.lunarDay);
  }

  updateMoonShadow() {
    // giorno lunare normalizzato 1–30
    const day = this.lunarDay;

    // 🌑 completamente nuova
    if (day === 30 || day === 0) {
      this.shadowOffset = 100;
      return;
    }

    // 🌕 massimo splendore a 14
    if (day <= 14) {
      this.shadowOffset = 0;
      return;
    }

    // 🌖 fase calante: 15 → 29
    // progress: 0 (giorno 15) → 1 (giorno 29)
    const progress = (day - 15) / 14;

    // curva dolce (molto importante)
    const eased = Math.pow(progress, 1.35);

    // max oscuramento ≈ 92% (mai subito nero)
    this.shadowOffset = eased * 92;
  }

  updateMoonScale() {
    const distance = Math.abs(this.lunarDay - 15);
    const normalized = 1 - distance / 15;

    // più evidente
    this.moonScale = 0.6 + normalized * 0.6;
  }

  updateFormattedDate(lang: string) {
  this.formattedDate = new Intl.DateTimeFormat(lang, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(this.today);
}

  ngOnDestroy() {
    if (this.dayCheckTimer) {
      clearInterval(this.dayCheckTimer);
    }
  }
}
