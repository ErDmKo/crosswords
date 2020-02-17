import { Injectable } from '@angular/core';
import { GirdWord } from './crossword/crossword.component';

@Injectable({
    providedIn: 'root',
})
export class LocalStorageService {
    storage: Window['localStorage'];
    GAME_LIST: string = 'games';

    constructor() {
        this.storage = window.localStorage;
    }
    setVal(key: string, val) {
        this.storage.setItem(key, JSON.stringify(val));
        return this;
    }
    getVal(key: string) {
        return JSON.parse(this.storage.getItem(key));
    }
    delVal(key: string) {
        this.storage.removeItem(key);
    }
    delGame(gameId: string) {
        const games = this.getGames();
        const index = games.indexOf(gameId);
        if (index != -1) {
            games.splice(index, 1);
            this.delVal(gameId);
            this.setVal(this.GAME_LIST, games);
        }
    }
    getGames(): string[] {
        return this.getVal(this.GAME_LIST) || [];
    }
    setGame(gameId: string, gameData: GirdWord[]) {
        this.setVal(gameId, gameData);
        const games = this.getGames();
        if (!games.includes(gameId)) {
            games.push(gameId);
        }
        this.setVal(this.GAME_LIST, games);
    }
}
