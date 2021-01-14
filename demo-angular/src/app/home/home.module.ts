import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptCommonModule } from 'nativescript-angular/common';
import { HomeRoutingModule } from './home-routing.module';
import { HomeComponent } from './home.component';
import { HideActionBarModule } from '@microexcel-csd/nativescript-hide-action-bar/angular';
@NgModule({
  imports: [
    NativeScriptCommonModule,
    HomeRoutingModule,
    HideActionBarModule
  ],
  declarations: [
    HomeComponent
  ],
  schemas: [
    NO_ERRORS_SCHEMA
  ]
})
export class HomeModule { }
