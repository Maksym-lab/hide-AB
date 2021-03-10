"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var page_1 = require("@nativescript/core/ui/page/page");
var HideActionBarDirective = (function () {
    function HideActionBarDirective(page) {
        this.page = page;
        this.page.actionBarHidden = true;
    }
    HideActionBarDirective = __decorate([
        core_1.Directive({
            selector: '[hideActionBar]'
        }),
        __metadata("design:paramtypes", [page_1.Page])
    ], HideActionBarDirective);
    return HideActionBarDirective;
}());
exports.HideActionBarDirective = HideActionBarDirective;
