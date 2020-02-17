import { Component } from '@angular/core';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
})
export class AppComponent {
    title = 'CrossWords';

    waitForCounter(): Promise<any> {
        return new Promise(resolve => {
            const counter = (window as any).yaCounter;
            if (!counter) {
                setTimeout(this.waitForCounter, 300);
            } else {
                resolve(counter);
            }
        });
    }
    async ngOnInit() {
        const counter = await this.waitForCounter();
        if (environment.production) {
            counter.hit('/');
        }
    }
}
