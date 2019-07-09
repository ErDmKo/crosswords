import {
    Component,
    OnInit,
    HostListener
} from '@angular/core';
import {
    CrosswordService,
    Word,
    Direction
} from '../crossword.service';

import { debounceTime } from 'rxjs/operators';
import { range, Subject } from 'rxjs';

interface Cell {
    words: Word[],
    index: string,
    selected: boolean,
    focus?: boolean,
    val?: string,
}
interface GirdWord {
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
    private grid: Cell[][]
    private margin = [0, 0]
    private answer: {
        hash: string,
        len: number,
        valid: boolean
    } = {
        hash: '',
        len: 0,
        valid: false
    }
    private len = {
        x: 0,
        y: 0
    }
    private size: Size = {
        width: 0,
        height: 0,
        font: 0
    }
    private selectedWord: GirdWord = null;
    private words: {
        [pk: string]: GirdWord;
    } = {}
    private resizeEvents: Subject<null>

    constructor(
        private crosswordService: CrosswordService,
    ) { }

    ngOnInit() {
        this.grid = [];
        this.getWords();
        this.resizeEvents = new Subject();
        this.resizeEvents
            .pipe(debounceTime(100))
            .subscribe(this.setSize.bind(this));
    }

    @HostListener('window:resize', ['$event'])
    onResize(event) {
          this.resizeEvents.next();
    }
    setSize() {
        const hSize = (window.innerWidth - 10) / this.len.x;
        const vSize = (window.innerHeight - 10) / this.len.y;
        const size = Math.min(hSize, vSize);
        this.size = {
            width: size,
            height: size,
            font: size - 5
        };
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

        const activeCells: {
            [key: string]: Word[]
        } = {};

        const firstCells: {
            [key: string]: {
                x?: number,
                y?: number
            }
        } = {
            sum: {
                x: 0,
                y: 0
            }
        }

        words.forEach((wordInfo, i) => {
            const cellKey = `${wordInfo.x}:${wordInfo.y}`;
            const sum = firstCells.sum[wordInfo.direction] += 1;
            if (!firstCells[cellKey]) {
                firstCells[cellKey] = {};
            }
            const cellVal = firstCells[cellKey];
            cellVal[wordInfo.direction] = sum;
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
                this.len[asix] = info.max - info.min;
            })
        });
        this.margin = [info.x.min, info.y.min];
        for (let i=0; i < this.len.y; i++) {
            this.grid[i] = [];
            for (let j=0; j < this.len.x; j++) {
                const coord = {
                    x: info.x.min + j,
                    y: info.y.min + i,
                };
                const key = `${coord.x}:${coord.y}`;
                this.grid[i].push({
                    words: activeCells[key],
                    index: this._getIndex(firstCells[key]),
                    selected: false,
                    focus: false,
                    val: ''
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
    getWords(): void {
        this.crosswordService
            .genCrossword(10)
            .subscribe((resp) => {
                this.girdGen(resp.words);
                this.answer = Object.assign(this.answer, {
                    hash: resp.answer,
                    len: resp.words.length
                });
            });
    }

}
