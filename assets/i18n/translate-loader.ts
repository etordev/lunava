import { Inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Resolves paths from the document `<base href>` so `assets/i18n/*.json` works
 * when the app is hosted under a subpath (e.g. GitHub Pages `/lunare/`).
 */
@Injectable()
export class JsonTranslateLoader implements TranslateLoader {
  constructor(
    private http: HttpClient,
    @Inject(DOCUMENT) private document: Document
  ) {}

  getTranslation(lang: string): Observable<any> {
    const href = this.document.querySelector('base')?.getAttribute('href') ?? '/';
    const base = href.endsWith('/') ? href : `${href}/`;
    const url = `${base}assets/i18n/${lang}.json`;
    return this.http.get(url);
  }
}
