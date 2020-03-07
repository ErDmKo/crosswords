from django.db import models
import pywikibot, re
from pywikibot import pagegenerators
from pymystem3 import Mystem
import re
from random import choice

wikiApi = pywikibot.Site()
m = Mystem()

class RandomManager(models.Manager):

    def wikiRnd(self, list_size=10):
        pages = pagegenerators.RandomPageGenerator(5000, wikiApi, '')
        obj_list = []
        for page in pages:
            title = page.title()
            if re.search(r'[\s\-]', title):
                continue
            try:
                result = m.analyze(title)
            except Exception:
                continue
            if not len(result):
                continue
            if not result[0].get('analysis'):
                continue
            if not len(result[0]['analysis']):
                continue
            lex = result[0]['analysis'][0]
            gr = lex['gr']
            grInfo = gr.split(',')
            if grInfo[0] !='S':
                continue
            if re.search(r'фам|имя|отч|гео', gr):
                continue
            categories = ', '.join([c.title() for c in page.categories()])
            if re.search(r'Населённые\sпункты', categories):
                continue
            try:
                item = pywikibot.ItemPage.fromPage(page)
            except Exception:
                continue
            info = item.get()
            if not info['descriptions'].get('ru'):
                continue
            desc = info['descriptions'].get('ru')
            if len(desc.split(' ')) <=3:
                continue
            if re.search(r'Викимедиа|страница', info['descriptions']['ru']):
                continue
            obj_list.append({
                'word': lex['lex'],
                'desc': info['descriptions']['ru']
            })
            print(lex, info['labels']['ru'])
            if len(obj_list) >= list_size:
                return obj_list
        return obj_list

    def random(self, limit = 1):
        count = self.count()
        return self.raw("""
            select * from {} TABLESAMPLE BERNOULLI ((%s * 100) / %s::decimal)
        """.format(self.model._meta.db_table), [limit, count])

    def _getEnds(self, x, y, lenWord, direction):
        if direction == '-':
            end =  [[x - 1, y], [x + lenWord, y]]
        else:
            end =  [[x, y - 1], [x, y + lenWord]]
        return end

    def getWordStart(self, chrNo, xChr, yChr, direction):
        if direction == '-':
            x = xChr - chrNo
            y = yChr
        else:
            x = xChr
            y = yChr - chrNo
        return [x, y]

    def _sigToDict(self, word, chrNo, xChr, yChr, direction):
        if direction == '-':
            xDelta = 1
            yDelta = 0
            writeDir = "|"
        else:
            xDelta = 0
            yDelta = 1
            writeDir = "-"
        [x, y] = self.getWordStart(chrNo, xChr, yChr, direction)
        for index, letter in enumerate(word):
            for cell in [1, 0, -1]:
                writeState = writeDir
                xIndex = x + (index * xDelta) + (cell * yDelta)
                yIndex = y + (index * yDelta) + (cell * xDelta)
                yield [letter, xIndex, yIndex, writeState, cell]

    def checkWord(self, word, chrNo, xChr, yChr, direction):
        score = 0
        gen = self._sigToDict(word, chrNo, xChr, yChr, direction)
        [x, y] = self.getWordStart(chrNo, xChr, yChr, direction)
        end = self._getEnds(x, y, len(word), direction)
        for [letter, xIndex, yIndex, writeState, cell] in gen:
            [val, cellDir] = self.getItem(yIndex, xIndex)
            if cell == 0:
                if val.upper() == letter.upper():
                    score += 1
                if val.upper() != letter.upper() and val != ' ':
                    return [False, 'l']
                if cellDir != ' ' and cellDir != direction:
                    return [False, 'w{}{}'.format(cellDir, val)]

        for [x, y] in end:
            [val, cellDir] = self.getItem(y, x)
            if val != ' ':
                return [False, 'e']

        return [True, score]

    def setWord(self, word, chrNo, xChr, yChr, direction):
        gen = self._sigToDict(word, chrNo, xChr, yChr, direction)
        [x, y] = self.getWordStart(chrNo, xChr, yChr, direction)
        end = self._getEnds(x, y, len(word), direction)
        for [letter, xIndex, yIndex, writeState, cell] in gen:
            if cell == 0:
                insertLetter = letter
            else:
                [val, cellDir] = self.getItem(yIndex, xIndex)
                if cellDir != ' ':
                    writeState = 'X'
                insertLetter = '{}'.format(val)
            self.setItem(
                yIndex,
                xIndex,
                '{}{}'.format(insertLetter, writeState)
            )

        for [y, x] in end:
            self.setItem(x, y, 'XX')

    def getItem(self, y, x):
        try:
            if len(self.field) <= y or len(self.field[y]) <= x:
                return [' ', ' ']
            return list(self.field[y][x])[1:3]
        except:
            # print (len(self.field), len(self.field[len(self.field)-1]), x,y)
            return [' ', ' ']

    def setItem(self, y, x, val):
        for i in range(y + 1):
            if len(self.field) <= i:
                self.field.append([])
            for j in range(x + 1):
                if len(self.field[i]) <= j:
                    self.field[i].append('|  ')
                if j == x and i == y:
                    self.field[y][x] = '|{}'.format(val)
                if j == x and j == len(self.field[i]) - 1:
                    self.field[i][j] += '|'

    def wordsToField(self, wordList, startX, startY):
        i = 0
        insertedList = []
        while len(wordList):
            scoreList = []
            hCount = 0
            vCount = 0
            (word, pk) = choice(wordList)
            wordList.remove((word, pk))
            if i == 0:
                data = [word, 0, startX, startY, '-', pk]
                self.setWord(*data[0:5])
                insertedList.append(data)
            else:
                for [inserted, chrNo, xChr, yChr, direction, *rest] in insertedList:
                    intersect = set(word.upper()) & set(inserted.upper())
                    if direction == '-':
                        hCount += 1
                    else:
                        vCount += 1
                    for letter in intersect:
                        for w in re.finditer(letter, word.upper()):
                            for x in re.finditer(letter, inserted.upper()):
                                wIndex = w.start()
                                iIndex = x.start()
                                [x, y] = self.getWordStart(chrNo, xChr, yChr, direction)
                                newDir = direction == '-' and '|' or '-'
                                if direction == '-':
                                    x += iIndex
                                else:
                                    y += iIndex
                                data = [word, wIndex, x, y, newDir, pk]
                                [isPlacablle, score] = self.checkWord(*data[0:5])
                                if isPlacablle:
                                    scoreList.append([data, score])
                if len(scoreList):
                    for scoreInfo in scoreList:
                        [info, score] = scoreInfo
                        if hCount > vCount and info[4] == '-' or \
                            vCount > hCount and info[4] != '-':
                            scoreInfo[1] -= .5

                    sortedScore = sorted(scoreList, key=lambda s: s[1], reverse=True)
                    filtredScore = filter(lambda s: s[1] == sortedScore[0][1], sortedScore)
                    [data, score] = choice(list(filtredScore))
                    # print(data, score)
                    self.setWord(*data[0:5])
                    insertedList.append(data)
            i += 1
        return insertedList

    def grid(self, silent=False, size=10, fromWiki=False):
        self.field = [[]]
        if fromWiki:
            wordInfo = self.wikiRnd(int(size));
            words = []
            for word in wordInfo:
                dbWord = Word(
                        word=word['word'],
                        description=word['desc'],
                        multivalued=1
                        )
                dbWord.save()
                words.append((dbWord.word, dbWord.id))
        else:
            words = [(word.word, word.id) \
                    for word in self.random(size)]
        # words = [('Дима', 1), ('Инея', 2)]
        self.setItem(100, 100, '  ')
        out = self.wordsToField(words, 30, 30)
        if not silent:
            for y in self.field:
                print('\n', end='')
                for x in y:
                    print(x, end='')
        print()
        return out

class Word(models.Model):
    SOURCE_CHOICES = (
        ('O', 'Ozigov'),
        ('W', 'Wiki'),
    )
    word = models.TextField(
        verbose_name='Word'
    )
    description = models.TextField(
        verbose_name='Description'
    )
    multivalued = models.PositiveSmallIntegerField(
        verbose_name='Multivalued'
    )
    source = models.CharField(max_length=1, default=SOURCE_CHOICES[0][0], choices=SOURCE_CHOICES)

    objects = models.Manager()
    rnd = RandomManager()

    def random(self, limit=1):
        return self._meta

    def __str__(self):
        return self.word

    class Meta:
        ordering = ['-id']
