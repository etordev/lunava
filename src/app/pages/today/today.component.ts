import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { LunareService } from '../../services/lunare.service';
import { CommonModule } from '@angular/common';
import { EpactService } from '../../services/epact.service';
import { LangChangeEvent, TranslateModule, TranslateService } from '@ngx-translate/core';
import { CdkMenuModule } from '@angular/cdk/menu';
import { AVAILABLE_LANGUAGES, DEFAULT_LANG } from '../../constants/lang';
import { LanguageService } from '../../services/language.service';
import { Dialog } from '@angular/cdk/dialog';
import { ExplanationDialogComponent } from '../../explanation-dialog/explanation-dialog.component';

@Component({
  selector: 'app-today',
   imports: [CommonModule, TranslateModule, CdkMenuModule],
  templateUrl: './today.component.html'
})

export class TodayComponent implements OnInit, OnDestroy {
  private lastComputedDate = new Date().toDateString();
  private dayCheckTimer?: number;
  /** Calendar date used for lunar day, phase, and moon visualization. */
  displayDate = new Date();
  readonly minPickDate = '1900-01-01';
  readonly maxPickDate = '2100-12-31';
  lunarDay = 0;
  phase = '';
  epact = 0;
  phaseLabel = '';
  shadowX = 100;
  moonScale = 1;
  shadowOffset = 0;
  languages = AVAILABLE_LANGUAGES;
  currentLang = DEFAULT_LANG;
  formattedDate = '';
  lunarDayLabel = 'LunarDayLabel';

  constructor(private _lunareService: LunareService,
              private _dialog: Dialog,
              private _translateService: TranslateService,
              private _languageService: LanguageService, 
              private _epactService: EpactService,
              private _cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.displayDate = new Date();
    this.initLang();
    this.initData();
    this.startDayWatcher();
  }

  isShowingToday(): boolean {
    const now = new Date();
    return (
      this.displayDate.getFullYear() === now.getFullYear() &&
      this.displayDate.getMonth() === now.getMonth() &&
      this.displayDate.getDate() === now.getDate()
    );
  }

  goToToday(): void {
    this.displayDate = new Date();
    void this.initData();
  }

  openDatePicker(input: HTMLInputElement): void {
    input.value = this.toIsoDate(this.displayDate);
    if (typeof input.showPicker === 'function') {
      input.showPicker();
    } else {
      input.click();
    }
  }

  onDatePicked(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (!value) {
      return;
    }
    const [y, m, d] = value.split('-').map(Number);
    this.displayDate = new Date(y, m - 1, d);
    void this.initData();
  }

  private toIsoDate(d: Date): string {
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${mo}-${day}`;
  }

  openExplanation() {
    this._dialog.open(ExplanationDialogComponent, {
      backdropClass: 'cdk-overlay-dark-backdrop',
      panelClass: 'lunare-dialog',
    });
  }
  
  startDayWatcher() {
    this.dayCheckTimer = window.setInterval(async () => {
    const todayString = new Date().toDateString();

    if (todayString !== this.lastComputedDate) {
      this.lastComputedDate = todayString;
      if (this.isShowingToday()) {
        this.displayDate = new Date();
        await this.initData();
        this._cdr.detectChanges();
      }
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
    const lang = this._translateService.currentLang || DEFAULT_LANG;
    this.updateFormattedDate(lang);
    this._cdr.detectChanges();
  }

  async setLunareData() {
    this.epact = await this._epactService.getEpactForDate(this.displayDate);
    console.log('Epact for date:', this.epact);
    const m = (this.displayDate.getMonth() + 10) % 12 + 1;
    const d = this.displayDate.getDate();
    console.log('month', m);
    console.log('day', d);
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
  }).format(this.displayDate);
}

  ngOnDestroy() {
    if (this.dayCheckTimer) {
      clearInterval(this.dayCheckTimer);
    }
  }
}
