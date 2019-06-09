import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export type Direction = 'x' | 'y';

export interface Word {
    pk: number,
    word: number,
    x: number,
    y: number,
    direction: Direction,
    description: string
}

export interface Resp {
    answer: string,
    words: Word[]
}

@Injectable({
  providedIn: 'root'
})
export class CrosswordService {
  private apiUrl = 'http://localhost:8000/api';

  constructor(
      private http: HttpClient,
  ) { }

    hashString(val) {
        var i, l,
            str = encodeURIComponent(val),
            hval = 0x811c9dc5,
            prime = 0x01000193;

        for (i = 0, l = str.length; i < l; i++) {
            hval = hval ^ (str.charCodeAt(i) & 0xFF);
            hval += (hval << 1)
                + (hval << 4)
                + (hval << 7)
                + (hval << 8)
                + (hval << 24);
        }
        return ("0000000"
            + (hval >>> 0).toString(16)).substr(-8);
    }

    genCrossword(size = 10) {
        return this.http
            .get<Resp>(`${this.apiUrl}/crossword?size=${size}`)
    }
}
