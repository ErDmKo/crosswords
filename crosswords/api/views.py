from rest_framework import viewsets
from rest_framework import serializers
from crosswords.models import Word
from rest_framework.response import Response
from rest_framework.views import APIView
import urllib, datetime

class WordSerializer(serializers.ModelSerializer):
    class Meta:
        model = Word
        fields = (
            'word',
            'description',
        )
class CrossSerializer(serializers.Serializer):
    pk = serializers.IntegerField()
    word = serializers.IntegerField()
    x = serializers.IntegerField()
    y = serializers.IntegerField()
    direction = serializers.CharField()
    description = serializers.CharField()
    hashWord = serializers.CharField()
    fullWord = serializers.CharField()
    # answer = serializers.CharField()

class RespSerializer(serializers.Serializer):
    words = CrossSerializer(many=True, read_only=True)
    answer = serializers.CharField()
    difficulty = serializers.CharField()
    genTime = serializers.DateTimeField()

class WordList(viewsets.ReadOnlyModelViewSet):
    queryset = Word.objects.all()
    serializer_class = WordSerializer

def java_string_hashcode(val):
    hval = 0x811c9dc5
    st = urllib.parse.quote_plus(val)
    fnv_32_prime = 0x01000193
    uint32_max = 2 ** 32
    if not isinstance(st, bytes):
        st = st.encode("UTF-8", "ignore")
    for s in st:
        hval = hval ^ s
        hval = (hval * fnv_32_prime) % uint32_max
    return hex(hval)[2:].zfill(8)

class GenCross(APIView):


    def get(self, request, format=None):
        rawCrossData = Word.rnd.grid(
            silent=True,
            size=self.request.query_params.get('size', 10),
        )
        difficulty = self.request.query_params.get('difficulty', '0')
        crossData = []
        pk = [data[5] for data in rawCrossData]
        answer = []
        words= {}
        descriptions = {}

        for obj in Word.objects.filter(pk__in=pk):
            descriptions[obj.id] = obj.description
            answer.append([obj.word, obj.id])
            words[obj.id] = obj.word

        for data in rawCrossData:
            [word, chrNo, xChr, yChr, direction, pk] = data
            [x, y] = Word.rnd.getWordStart(
                chrNo,
                xChr,
                yChr,
                direction
            )
            dataToFront = {
                'pk': pk,
                'word': len(word),
                'x': x,
                'y': y,
                'direction': direction == '-' and 'x' or 'y',
                'description': descriptions.get(pk, ''),
                'answer': words.get(pk, ''),
            }

            dataToFront['fullWord'] = word if difficulty == '0' else None
            dataToFront['hashWord'] = java_string_hashcode(word) if difficulty == '1' else None

            crossData.append(dataToFront)
        ansList = sorted(answer, key=lambda e: e[1])
        ansList = '-'.join(map(lambda e: e[0], ansList))
        serializer = RespSerializer({
            'answer': java_string_hashcode(ansList),
            'difficulty': difficulty,
            'words': crossData,
            'genTime': datetime.datetime.now()
        })
        return Response(serializer.data)
