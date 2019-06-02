import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export interface Word {
    pk: number,
    word: number,
    x: number,
    y: number,
    direction: string,
}

@Injectable({
  providedIn: 'root'
})
export class CrosswordService {
  private apiUrl = 'http://localhost:8000/api';

  constructor(
      private http: HttpClient,
  ) { }

  genCrossword() {
      return this.http.get<Word[]>(`${this.apiUrl}/crossword`)
  }
}
