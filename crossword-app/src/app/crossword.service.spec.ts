import { TestBed } from '@angular/core/testing';

import { CrosswordService } from './crossword.service';

describe('CrosswordService', () => {
    beforeEach(() => TestBed.configureTestingModule({}));

    it('should be created', () => {
        const service: CrosswordService = TestBed.get(CrosswordService);
        expect(service).toBeTruthy();
    });
});
