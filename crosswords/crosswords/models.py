from django.db import models


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
    def __str__(self):
        return self.word
