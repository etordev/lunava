import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AVAILABLE_LANGUAGES, DEFAULT_LANG } from '../constants/lang';


@Injectable({ providedIn: 'root' })
export class LanguageService {
  defaultLanguage = DEFAULT_LANG;

  constructor(private translate: TranslateService) {}

  async init() {
    const saved = await this.loadFromDb();
    const lang = saved ?? this.defaultLanguage;

    this.translate.addLangs(AVAILABLE_LANGUAGES);
    this.translate.setDefaultLang(this.defaultLanguage);
    this.translate.use(lang);
  }

  set(lang: string) {
    this.translate.use(lang);
    this.saveToDb(lang);
  }

  get current(): string {
    return this.translate.currentLang;
  }

  /* ---- IndexedDB (come EpactService) ---- */

  async saveToDb(lang: string) {
    localStorage.setItem('lunare-lang', lang); // placeholder
  }

  async loadFromDb(): Promise<string> {
    return localStorage.getItem('lunare-lang') || '';
  }
}
