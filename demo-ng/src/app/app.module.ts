import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptModule, NativeScriptRouterModule } from "@nativescript/angular";
import { HideActionBarModule } from '@microexcel-csd/nativescript-hide-action-bar/angular';
import { AppComponent } from "./app.component";
import { HomeComponent } from './home/home.component';
import { AppRoutingModule } from './app-routing.module';
@NgModule({
    bootstrap: [
        AppComponent
    ],
    imports: [
        NativeScriptModule,
        NativeScriptRouterModule,
        AppRoutingModule,
        HideActionBarModule
    ],
    declarations: [
        AppComponent,
        HomeComponent
    ],
    providers: [],
    schemas: [
        NO_ERRORS_SCHEMA
    ]
})
export class AppModule { }
