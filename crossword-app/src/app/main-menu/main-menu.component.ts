import { Component, OnInit } from '@angular/core';
import { LocalStorageService } from '../local-storage.service';

@Component({
  selector: 'app-main-menu',
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.css']
})
export class MainMenuComponent implements OnInit {
  games: string[];

  constructor(
    private localStorageService: LocalStorageService,
  ) { }

  ngOnInit() {
    this.games = this.localStorageService.getGames();
  }
  delGame(gameId) {
    this.localStorageService.delGame(gameId);
    this.games = this.localStorageService.getGames();
  }
}
