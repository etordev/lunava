import { DialogRef } from '@angular/cdk/dialog';
import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-explanation-dialog',
  imports: [TranslateModule],
  templateUrl: 'explanation-dialog.component.html'
})
export class ExplanationDialogComponent {

    constructor(private _dialogRef: DialogRef) {}

    close() {
        this._dialogRef.close();
    }
}
