import { Component } from "@angular/core";
@Component({
    selector: "Home",
    templateUrl: "./home.component.html"
})
export class HomeComponent {
    directiveApplied = false;
    constructor() {}
    toggleDirective(): void {
        this.directiveApplied = !this.directiveApplied;
    }
}
