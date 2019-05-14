from django.db import models

class RandomManager(models.Manager):

    def random(self, limit = 1):
        count = self.count()
        return self.raw("""
            select * from {} TABLESAMPLE BERNOULLI ((%s * 100) / %s::decimal)
        """.format(self.model._meta.db_table), [limit, count])

    def setItem(self, field, y, x, val):
        for i in range(y + 1):
            if len(field) <= i:
                field.append([])
            for j in range(x + 1):
                if len(field[i]) <= j:
                    field[i].append('|  ')
                if j == x and i == y:
                    field[y][x] = '|{}'.format(val)
                if j == x and j == len(field[i]) - 1:
                    field[i][j] += '|'
                    

    def grid(self):
        field = [[]]
        self.setItem(field, 10, 9, '  ')
        for index, letter in enumerate('Инея'):
            self.setItem(field, 5, 3+index, '{}+'.format(letter))
        for y in field:
            print('\n', end='')
            for x in y:
                print(x, end='')

class Word(models.Model):
    word = models.TextField(
        verbose_name='Word'
    )
    description = models.TextField(
        verbose_name='Description'
    )
    multivalued = models.PositiveSmallIntegerField(
        verbose_name='Multivalued'
    ) 

    objects = models.Manager()
    rnd = RandomManager()

    def random(self, limit=1):
        return self._meta

    def __str__(self):
        return self.word
