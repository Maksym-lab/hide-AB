"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var hide_action_bar_directive_1 = require("./hide-action-bar.directive");
var HideActionBarModule = (function () {
    function HideActionBarModule() {
    }
    HideActionBarModule = __decorate([
        core_1.NgModule({
            declarations: [hide_action_bar_directive_1.HideActionBarDirective],
            exports: [hide_action_bar_directive_1.HideActionBarDirective]
        })
    ], HideActionBarModule);
    return HideActionBarModule;
}());
exports.HideActionBarModule = HideActionBarModule;
