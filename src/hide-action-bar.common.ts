import { Observable } from 'tns-core-modules/data/observable';
import * as app from 'tns-core-modules/application';
export class Common extends Observable {
  public message: string;
  constructor() {
    super();
    this.message = Utils.SUCCESS_MSG();
  }
  public greet() {
    return "Hello, NS";
  }
}
export class Utils {
  public static SUCCESS_MSG(): string {
    let msg = `Your plugin is working on ${app.android ? 'Android' : 'iOS'}.`;
    return msg;
  }
}
