import { Injectable } from '@angular/core';
import { GirdWord } from './crossword/crossword.component';
import { Difficulty } from './main-menu/main-menu.component';

export type GameMeta = {
    difficulty: Difficulty;
    lastUpdate: number;
};

export type GameInfo = {
    id: string;
    words: GirdWord[];
} & GameMeta;

@Injectable({
    providedIn: 'root',
})
export class LocalStorageService {
    storage: Window['localStorage'];
    GAME_LIST: string = 'games';
    META_LIST: string = 'game';

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
    getGameMeta(id: string): GameMeta {
        return this.getVal(`${this.META_LIST}-${id}`);
    }
    getGame(id: string): GameInfo {
        const words = this.getVal(id);
        return words
            ? {
                  id,
                  words,
                  ...this.getGameMeta(id),
              }
            : null;
    }
    setGame(gameId: string, gameData: GirdWord[], difficulty: Difficulty) {
        this.setVal(gameId, gameData);
        this.setVal(`${this.META_LIST}-${gameId}`, {
            difficulty,
            lastUpdate: new Date().getTime(),
        } as GameMeta);
        const games = this.getGames();
        if (!games.includes(gameId)) {
            games.push(gameId);
        }
        this.setVal(this.GAME_LIST, games);
    }
}
