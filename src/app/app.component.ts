import { Component, signal } from '@angular/core';
import { TodayComponent } from './pages/today/today.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TodayComponent],
  templateUrl: 'app.component.html',
  styleUrl: 'app.css'
})
export class AppComponent {
  protected readonly title = signal('lunare');
}
