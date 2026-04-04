import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { LunareService, LunarDayMarker } from '../../services/lunare.service';
import { CommonModule } from '@angular/common';
import { EpactService } from '../../services/epact.service';
import { LangChangeEvent, TranslateModule, TranslateService } from '@ngx-translate/core';
import { CdkMenuModule } from '@angular/cdk/menu';
import { AVAILABLE_LANGUAGES, DEFAULT_LANG } from '../../constants/lang';
import { LanguageService } from '../../services/language.service';
import { Dialog } from '@angular/cdk/dialog';
import { ExplanationDialogComponent } from '../../explanation-dialog/explanation-dialog.component';

export interface CalendarCell {
  date: Date;
  inMonth: boolean;
  dayOfMonth: number;
  lunarDay: number;
  marker: LunarDayMarker | null;
  selected: boolean;
  inRange: boolean;
}

@Component({
  selector: 'app-today',
  imports: [CommonModule, TranslateModule, CdkMenuModule],
  templateUrl: './today.component.html',
})
export class TodayComponent implements OnInit, OnDestroy {
  @ViewChild('datePickerWrap') datePickerWrap?: ElementRef<HTMLElement>;

  private lastComputedDate = new Date().toDateString();
  private dayCheckTimer?: number;
  /** Calendar date used for lunar day, phase, and moon visualization. */
  displayDate = new Date();
  readonly minPickDate = '1900-01-01';
  readonly maxPickDate = '2100-12-31';
  private readonly minPickDateObj = new Date(1900, 0, 1, 12, 0, 0);
  private readonly maxPickDateObj = new Date(2100, 11, 31, 12, 0, 0);

  /** Custom month grid: native date input cannot mark individual days. */
  calendarOpen = false;
  calendarViewMonth = new Date();
  calendarCells: CalendarCell[] = [];
  calendarWeekdayLabels: string[] = [];
  calendarMonthTitle = '';
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

  toggleCalendar(event: Event): void {
    event.stopPropagation();
    this.calendarOpen = !this.calendarOpen;
    if (this.calendarOpen) {
      this.calendarViewMonth = new Date(
        this.displayDate.getFullYear(),
        this.displayDate.getMonth(),
        1
      );
      this.rebuildCalendar();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.calendarOpen) return;
    const t = event.target as Node;
    if (this.datePickerWrap?.nativeElement.contains(t)) return;
    this.calendarOpen = false;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.calendarOpen) this.calendarOpen = false;
  }

  canPrevCalendarMonth(): boolean {
    const y = this.calendarViewMonth.getFullYear();
    const m = this.calendarViewMonth.getMonth();
    return y > 1900 || (y === 1900 && m > 0);
  }

  canNextCalendarMonth(): boolean {
    const y = this.calendarViewMonth.getFullYear();
    const m = this.calendarViewMonth.getMonth();
    return y < 2100 || (y === 2100 && m < 11);
  }

  prevCalendarMonth(): void {
    if (!this.canPrevCalendarMonth()) return;
    const y = this.calendarViewMonth.getFullYear();
    const m = this.calendarViewMonth.getMonth();
    this.calendarViewMonth = new Date(y, m - 1, 1);
    this.rebuildCalendar();
  }

  nextCalendarMonth(): void {
    if (!this.canNextCalendarMonth()) return;
    const y = this.calendarViewMonth.getFullYear();
    const m = this.calendarViewMonth.getMonth();
    this.calendarViewMonth = new Date(y, m + 1, 1);
    this.rebuildCalendar();
  }

  selectCalendarDay(cell: CalendarCell): void {
    if (!cell.inRange) return;
    this.displayDate = new Date(cell.date);
    this.calendarOpen = false;
    void this.initData();
  }

  calendarCellAriaLabel(cell: CalendarCell): string {
    const day = String(cell.dayOfMonth);
    if (!cell.marker) {
      return day;
    }
    const key =
      cell.marker === 'new'
        ? 'CalendarMarkNew'
        : cell.marker === 'full'
          ? 'CalendarMarkFull'
          : 'CalendarMarkHalf';
    return `${day}, ${this._translateService.instant(key)}`;
  }

  private isDateInPickRange(d: Date): boolean {
    const t = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0).getTime();
    return t >= this.minPickDateObj.getTime() && t <= this.maxPickDateObj.getTime();
  }

  rebuildCalendar(): void {
    const lang = this._translateService.currentLang || DEFAULT_LANG;
    const baseMonday = new Date(2024, 0, 1);
    this.calendarWeekdayLabels = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(baseMonday);
      d.setDate(baseMonday.getDate() + i);
      return new Intl.DateTimeFormat(lang, { weekday: 'short' }).format(d);
    });

    const y = this.calendarViewMonth.getFullYear();
    const m = this.calendarViewMonth.getMonth();
    this.calendarMonthTitle = new Intl.DateTimeFormat(lang, {
      month: 'long',
      year: 'numeric',
    }).format(this.calendarViewMonth);

    const first = new Date(y, m, 1);
    const startOffset = (first.getDay() + 6) % 7;
    const cells: CalendarCell[] = [];
    const cur = new Date(y, m, 1 - startOffset);

    for (let i = 0; i < 42; i++) {
      const epact = this._epactService.getEpactForDateSync(cur);
      const monthFromMarch = (cur.getMonth() + 10) % 12 + 1;
      const lunarDay = this._lunareService.calcLunarDay(
        epact,
        monthFromMarch,
        cur.getDate()
      );
      const ld = lunarDay < 1 || lunarDay > 30 ? 1 : lunarDay;
      const marker = this._lunareService.lunarDayMarker(ld);
      const inMonth = cur.getMonth() === m;
      const inRange = this.isDateInPickRange(cur);
      const selected =
        cur.getFullYear() === this.displayDate.getFullYear() &&
        cur.getMonth() === this.displayDate.getMonth() &&
        cur.getDate() === this.displayDate.getDate();

      cells.push({
        date: new Date(cur),
        inMonth,
        dayOfMonth: cur.getDate(),
        lunarDay: ld,
        marker,
        selected,
        inRange,
      });
      cur.setDate(cur.getDate() + 1);
    }

    this.calendarCells = cells;
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
        if (this.calendarOpen) {
          this.rebuildCalendar();
        }
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
    const distance = Math.abs(this.lunarDay - 14);
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
