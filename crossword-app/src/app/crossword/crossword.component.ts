import { Component, OnInit } from '@angular/core';
import { CrosswordService, Word } from '../crossword.service';
import { debounceTime } from 'rxjs/operators';
import { range, Subject } from 'rxjs';

interface Cell {
    words: Word[],
    index: number,
    selected: boolean,
    focus?: boolean,
    val?: string,
}

@Component({
  selector: 'app-crossword',
  templateUrl: './crossword.component.html',
  styleUrls: ['./crossword.component.css']
})
export class CrosswordComponent implements OnInit {
    private grid: Cell[][]
    private margin = [0, 0]
    private selectedWord: Cell[] = []
    private focusEvents: Subject<Cell>

    constructor(
        private crosswordService: CrosswordService
    ) { }

    ngOnInit() {
        this.focusEvents = new Subject();
        this.focusEvents
            .pipe(debounceTime(100))
            .subscribe(this.onFocus.bind(this))
        this.grid = [];
        this.getWords();
    }

    girdGen(words: Word[]) {
        const info = {
            x: {
                max: 0,
                min: Infinity
            },
            y: {
                max: 0,
                min: Infinity
            }
        }
        let len = {
            x: 0,
            y: 0
        };

        const activeCells: {
            [key: string]: Word[]
        } = {};
        const firstCells: {
            [key: string]: number
        } = {}

        words.forEach((wordInfo, i) => {
            firstCells[`${wordInfo.x}:${wordInfo.y}`] = i + 1;
            Object.entries(info).forEach(([asix, info]) => {
                const val = wordInfo[asix];
                const opositAsix = asix == 'x' ? 'y' : 'x';
                let maxVal = val;
                if (asix == wordInfo.direction) {
                    maxVal += wordInfo.word;
                    range(val, wordInfo.word)
                        .subscribe((val) => {
                            const key =[
                                wordInfo[opositAsix],
                                val,
                            ];
                            if (asix === 'x') {
                                key.reverse();
                            }
                            const strKey = key.join(':');
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
                if (info.min > val) {
                    info.min = val;
                }
                len[asix] = info.max - info.min;
            })
        });
        this.margin = [info.x.min, info.y.min];
        for (let i=0; i < len.y; i++) {
            this.grid[i] = [];
            for (let j=0; j < len.x; j++) {
                const coord = {
                    x: info.x.min + j,
                    y: info.y.min + i,
                };
                const key = `${coord.x}:${coord.y}`;
                this.grid[i].push({
                    words: activeCells[key],
                    index: firstCells[key],
                    selected: false,
                    focus: false,
                    val: ''
                })
            }
        }
    }
    focus(cell) {
        this.focusEvents.next(cell);
    }
    onFocus(cell): void {
        const [mX, mY] = this.margin;
        const startCell = this.grid[cell.words[0].y - mY][cell.words[0].x - mX];
        const word = startCell.words.filter(word => {
            return word.direction == cell.words[0].direction;
        })[0];

        if (this.selectedWord.length
            && this.selectedWord[0].words[0] == cell.words[0]
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
        this.selectedWord.forEach(cell => {
            cell.selected = false;
        })
        this.selectedWord = [];
        range(word[asix], word.word).subscribe((coord)=> {
            let {x, y} = word;
            if (word.direction == 'x') {
                x = coord;
            } else {
                y = coord;
            }
            const cell = this.grid[y - mY][x - mX];
            cell.selected = true;
            this.selectedWord.push(cell);
        });
    }
    onInput(e: KeyboardEvent, cell: Cell): void {
        const target = e.target as HTMLInputElement;
        const currentIndex = this.selectedWord.indexOf(cell);
        if (cell.val.length) {
            e.preventDefault();
            cell.val = cell.val.slice(0, 1);
        }
        cell.focus = false;
        const nextCell = this.selectedWord[currentIndex + 1 % cell.words[0].word];
        nextCell.focus = true;
    }
    getWords(): void {
        this.crosswordService
            .genCrossword()
            .subscribe((resp) => this.girdGen(resp));
    }

}
