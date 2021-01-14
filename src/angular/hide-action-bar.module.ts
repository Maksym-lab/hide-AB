import { NgModule } from '@angular/core';
import { HideActionBarDirective } from './hide-action-bar.directive';
@NgModule({
  declarations: [HideActionBarDirective],
  exports: [HideActionBarDirective]
})
export class HideActionBarModule { }
