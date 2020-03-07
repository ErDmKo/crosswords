from django.core.management.base import BaseCommand, CommandError
from crosswords.models import Word

class Command(BaseCommand):

    help = 'Add new words from wiki',

    def handle(self, *args, **options):
        while True:
            rawCrossData = Word.rnd.wikiRnd(5000) 
            if not rawCrossData:
                continue
            for word in rawCrossData:
                if not Word.objects.filter(word = word['word']).count():
                    dbWord = Word(
                        word=word['word'],
                        description=word['desc'],
                        multivalued=1,
                        source=Word.SOURCE_CHOICES[1][0]
                    )
                    dbWord.save()
                else:
                    print(word['word'] + ' exist')
        self.stdout.write('done')
