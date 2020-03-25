import { Component, OnInit } from '@angular/core';
import { LocalStorageService } from '../local-storage.service';
import { AnalyticsService } from '../analytics.service';

export type Difficulty = '0' | '1' | '2';
type SelDifficulty = [Difficulty, string];

const difLabels: SelDifficulty[] = [
    ['0', 'Низкая'],
    ['1', 'Средняя'],
    ['2', 'Высокая'],
];

@Component({
    selector: 'app-main-menu',
    templateUrl: './main-menu.component.html',
    styleUrls: ['./main-menu.component.css'],
})
export class MainMenuComponent implements OnInit {
    games: string[];
    difLabels = difLabels;
    difficulty = difLabels[0];
    yaCounter: any;

    constructor(
        private localStorageService: LocalStorageService,
        private analyticsService: AnalyticsService
    ) {}

    ngOnInit() {
        this.games = this.localStorageService.getGames();
        this.analyticsService.call('hit', '/');
    }
    delGame(gameId) {
        this.localStorageService.delGame(gameId);
        this.games = this.localStorageService.getGames();
    }
}
