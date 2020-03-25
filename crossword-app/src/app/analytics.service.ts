import { Injectable } from '@angular/core';
import { ArgumentType } from '@angular/compiler/src/core';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  queue: any[] = [];
  yaCounter: any;

  constructor() {
    this.awaitForCounter();
  }

  call(method: string, ...args) {
    return this.queue.push([method, ...args]);
  }
  private proxyCall([method, ...args]) {
    return this.yaCounter[method](...args);
  }

  awaitForCounter(tryNo = 0) {
    this.yaCounter = (window as any).yaCounter;
    if (this.yaCounter) {
      this.queue.forEach(this.proxyCall.bind(this));
      this.queue.push = this.proxyCall.bind(this);
    } else {
      setTimeout(this.awaitForCounter.bind(this), 300);
    }
  }


}
