import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type Lang = 'en' | 'it' | 'fr' | 'de' | 'es';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  readonly DEFAULT_LANG: Lang = 'en';

  constructor(private translate: TranslateService) {}

  async init() {
    const saved = await this.loadFromDb();
    const lang = saved ?? this.DEFAULT_LANG;

    this.translate.addLangs(['en','it','fr','de','es']);
    this.translate.setDefaultLang(this.DEFAULT_LANG);
    this.translate.use(lang);
  }

  set(lang: Lang) {
    this.translate.use(lang);
    this.saveToDb(lang);
  }

  get current(): Lang {
    return this.translate.currentLang as Lang;
  }

  /* ---- IndexedDB (come EpactService) ---- */

  async saveToDb(lang: Lang) {
    localStorage.setItem('lunava-lang', lang); // placeholder
  }

  async loadFromDb(): Promise<Lang | null> {
    return localStorage.getItem('lunava-lang') as Lang | null;
  }
}
