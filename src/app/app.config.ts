import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, HttpClientModule, HttpClient } from '@angular/common/http';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { routes } from './app.routes';
import { JsonTranslateLoader } from '../assets/i18n/translate-loader';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withFetch()),

    importProvidersFrom(
      HttpClientModule,
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useClass: JsonTranslateLoader,
          deps: [HttpClient]
        },
        useDefaultLang: true,
        defaultLanguage: 'en',
        fallbackLang: 'en'
      })
    )
  ]
};
