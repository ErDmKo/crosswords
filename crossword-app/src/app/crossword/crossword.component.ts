import {
    Component,
    OnInit,
    HostListener
} from '@angular/core';

import {
    LocalStorageService
} from '../local-storage.service';

import {
    CrosswordService,
    Word,
    Direction,
    Resp
} from '../crossword.service';

import { 
    debounceTime,
    catchError,
} from 'rxjs/operators';
import { 
    range,
    Subject,
    of,
    Observable
} from 'rxjs';

import { ActivatedRoute, Router } from '@angular/router';

interface Cell {
    words: Word[],
    index: string,
    selected: boolean,
    focus?: boolean,
    val?: string,
}
export interface GirdWord {
    cells: Cell[],
    word: Word,
    dir: Direction
}

interface Size {
    width: number,
    height: number,
    font: number
}

@Component({
  selector: 'app-crossword',
  templateUrl: './crossword.component.html',
  styleUrls: ['./crossword.component.css']
})
export class CrosswordComponent implements OnInit {
    grid: Cell[][];
    selectedWord: GirdWord = null;
    answer: {
        hash: string,
        len: number,
        valid: boolean
    } = {
        hash: '',
        len: 0,
        valid: false
    }
    error: string
    load: boolean = false

    private margin = [0, 0]
    private len = {
        x: 0,
        y: 0
    }
    private size: Size = {
        width: 0,
        height: 0,
        font: 0
    }
    private words: {
        [pk: string]: GirdWord;
    } = {}
    private resizeEvents: Subject<null>
    private saveEvents: Subject<null>

    constructor(
        private route: ActivatedRoute,
        private crosswordService: CrosswordService,
        private router: Router,
        private localStorageService: LocalStorageService,
    ) { }

    ngOnInit() {
        this.load = true;
        this.grid = [];
        this.resizeEvents = new Subject();
        this.saveEvents = new Subject();
        this.saveEvents
            .pipe(debounceTime(1000))
            .subscribe(this.updateLsSate.bind(this));
        this.resizeEvents
            .pipe(debounceTime(100))
            .subscribe(this.setSize.bind(this));
        const urlId = this.route.snapshot.paramMap.get('id');
        const gameInfo: GirdWord[] = this.localStorageService.getVal(urlId);
        if (gameInfo) {
            this.initCross(urlId, gameInfo);
            this.load = false;
        } else {
            this.getWords();
        }
    }

    @HostListener('window:resize', ['$event'])
    onResize() {
          this.resizeEvents.next();
    }
    setSize() {
        const hSize = (window.innerWidth - 10) / (this.len.x || 10);
        const vSize = (window.innerHeight - 10) / (this.len.y || 10);
        const size = Math.min(hSize, vSize);
        this.size = {
            width: size,
            height: size,
            font: size - 5
        };
    }

    girdGen(words: GirdWord[]) {
        const girdInfo = {
            x: {
                max: 0,
                min: Infinity
            },
            y: {
                max: 0,
                min: Infinity
            }
        }

        const activeCells: Record<string, Word[]> = {};
        const cellValues: Record<string, string> = {};
        const firstCells: Record<string, {
            x?: number,
            y?: number
        }> = {
            sum: {
                x: 0,
                y: 0
            }
        }
        words.forEach((girdWordInfo, i) => {
            const { word: wordInfo } = girdWordInfo;
            const cellKey = `${wordInfo.x}:${wordInfo.y}`;
            const sum = firstCells.sum[wordInfo.direction] += 1;
            if (!firstCells[cellKey]) {
                firstCells[cellKey] = {};
            }
            const cellVal = firstCells[cellKey];
            cellVal[wordInfo.direction] = sum;
            Object.entries(girdInfo).forEach(([asix, info]) => {
                const minVal = wordInfo[asix];
                let maxVal = minVal;
                if (asix == wordInfo.direction) {
                    maxVal = minVal + wordInfo.word;
                    const opositAsix = asix == 'x' ? 'y' : 'x';
                    const { cells = [] } = girdWordInfo;
                    range(minVal, wordInfo.word)
                        .subscribe((val) => {
                            const cell = cells[val - minVal];
                            const key =[
                                wordInfo[opositAsix],
                                val,
                            ];
                            if (asix === 'x') {
                                key.reverse();
                            }
                            const strKey = key.join(':');
                            if (cell) {
                                cellValues[strKey] = cell.val;
                            }
                            let info = activeCells[strKey];
                            if (!info) {
                                info = []
                            }
                            info.push(wordInfo);
                            activeCells[strKey] = info;
                        });
                }
                if (info.max < maxVal) {
                    info.max = maxVal;
                }
                if (info.min > minVal) {
                    info.min = minVal;
                }
                this.len[asix] = info.max - info.min;
            });
        });
        this.localStorageService.setGame(this.answer.hash, words);
        this.margin = [girdInfo.x.min, girdInfo.y.min];
        for (let i=0; i < this.len.y; i++) {
            this.grid[i] = [];
            for (let j=0; j < this.len.x; j++) {
                const coord = {
                    x: girdInfo.x.min + j,
                    y: girdInfo.y.min + i,
                };
                const key = `${coord.x}:${coord.y}`;
                this.grid[i].push({
                    words: activeCells[key],
                    index: this._getIndex(firstCells[key]),
                    selected: false,
                    focus: false,
                    val: cellValues[key] || ''
                })
            }
        }
        this.resizeEvents.next();
    }

    _getIndex(indexInfo) {
        if (!indexInfo) {
            return null;
        }
        if (indexInfo.x == indexInfo.y) {
           return indexInfo.x;
        }
        return [indexInfo.x, indexInfo.y].filter(Boolean).join('/');
    }
    onClick(cell): void {
        const [mX, mY] = this.margin;
        let startWord = cell.words[0];
        if (cell.selected && cell.words.length > 1 && this.selectedWord) {
            startWord = cell.words.find(w => w.direction != this.selectedWord.dir);
        }
        const startCell = this.grid[startWord.y - mY][startWord.x - mX];
        const word = startCell.words.find(word => {
            return word.direction == startWord.direction;
        });

        if (this.selectedWord
            && this.selectedWord.word == startWord
        ) {
            return;
        }
        let asix, margin;
        if (word.direction == 'x') {
            asix = 'x';
            margin = mX;
        } else {
            asix = 'y';
            margin = mY;
        }
        if (this.selectedWord) {
            this.selectedWord.cells.forEach(cell => {
                cell.selected = false;
            })
        }
        this.selectedWord = {
            cells: [],
            word: startWord,
            dir: word.direction
        }
        range(word[asix], word.word).subscribe((coord)=> {
            let {x, y} = word;
            if (word.direction == 'x') {
                x = coord;
            } else {
                y = coord;
            }
            const cell = this.grid[y - mY][x - mX];
            cell.selected = true;
            this.selectedWord.cells.push(cell);
        });
        this.words[this.selectedWord.word.pk] = this.selectedWord;
    }
    onFocus(cell: Cell): void {
        cell.focus = true;
    }
    onBlur(cell: Cell): void {
        cell.focus = false;
    }
    onUp(e: KeyboardEvent, cell) {
        if (e.key == 'Backspace' && !cell.val) {
            const currentIndex = this.selectedWord.cells.indexOf(cell);
            cell.focus = false;

            const nextCellIndex = currentIndex ?
                Math.max(currentIndex - 1, 0) % this.selectedWord.cells.length :
                0 // this.selectedWord.cells.length - 1;

            const nextCell = this.selectedWord.cells[nextCellIndex];
            nextCell.focus = true;
        }
    }
    updateLsSate() {
        const lastState: GirdWord[] = this.localStorageService.getVal(
            this.answer.hash
        );
        const newState = lastState.map((girdWord: GirdWord): GirdWord => {
            const word = this.words[girdWord.word.pk];
            if (word) {
                return word;
            }
            return girdWord;
        });
        this.localStorageService.setGame(this.answer.hash, newState);
    }
    onInput(e: KeyboardEvent, cell: Cell): void {
        if (!cell.val) {
            return;
        }
        const target = e.target as HTMLInputElement;
        const currentIndex = this.selectedWord.cells.indexOf(cell);
        let dir = 1;
        setTimeout(()=> {
            cell.val = cell
                .val
                .split('')
                .reverse()
                .slice(0, 1)
                .join('');
            this.validate()
            this.saveEvents.next();
        }, 1);
        cell.focus = false;
        const nextCell = this.selectedWord.cells[
            Math.max(currentIndex + dir, 0) % this.selectedWord.cells.length
        ];
        nextCell.focus = true;
    }
    validate() {
        const wordList = Object.entries(this.words)
            .reduce((wordList, [pk, wordInfo]) => {
                const word = wordInfo.cells.map(e => e.val).join('');
                wordList.push({
                    pk,
                    word
                });
                return wordList;
            }, [])
            .sort((a, b)=> a.pk - b.pk)
            .map(e => e.word)
            .join('-');
        const hash = '' + this.crosswordService.hashString(wordList);
        this.answer.valid =
            Object.keys(this.words).length == this.answer.len
            && this.answer.hash == hash;
    }
    initCross(answer: string, words: GirdWord[]): void {
        this.answer = Object.assign(this.answer, {
            hash: answer,
            len: words.length
        });
        this.girdGen(words);
    }
    getWords(): void {
        this.crosswordService
            .genCrossword(10)
            .pipe(
                catchError((e): Observable<Resp> => {
                    return of({
                        error: e.name
                    });
                })
            )
            .subscribe((resp: Resp) => {
                this.load = false;
                if (resp.error == "HttpErrorResponse") {
                    this.error = 'Backend unavailable';
                    this.resizeEvents.next();
                    return;
                } 
                const girdWords: GirdWord[] = resp.words.map((e: Word): GirdWord  => ({
                   cells: [],
                   word: e,
                   dir: e.direction
                }));
                this.initCross(resp.answer, girdWords);
                this.router.navigate([`/game/${resp.answer}`]);
            });
    }

}
