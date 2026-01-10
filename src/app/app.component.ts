import { Component, OnInit, signal } from '@angular/core';
import { TodayComponent } from './pages/today/today.component';
import { LanguageService } from './services/language.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TodayComponent],
  templateUrl: 'app.component.html',
  styleUrl: 'app.css'
})
export class AppComponent implements OnInit {
  protected readonly title = signal('lunare');

  constructor(private _languageService: LanguageService) {}

  ngOnInit() {
    this.initLanguage();
  }

  async initLanguage() {
    await this._languageService.init();
  }
}
