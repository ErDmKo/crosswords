from rest_framework import viewsets
from rest_framework import serializers
from crosswords.models import Word
from rest_framework.response import Response
from rest_framework.views import APIView

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

class WordList(viewsets.ReadOnlyModelViewSet):
    queryset = Word.objects.all()
    serializer_class = WordSerializer

class GenCross(APIView):
    def get(self, request, format=None):
        rawCrossData = Word.rnd.grid(silent=True)
        crossData = []
        for data in rawCrossData:
            [word, chrNo, xChr, yChr, direction, pk] = data
            [x, y] = Word.rnd.getWordStart(
                chrNo,
                xChr,
                yChr,
                direction
            )
            crossData.append({
                'pk': pk,
                'word': len(word),
                'x': x,
                'y': y,
                'direction': direction == '-' and 'x' or 'y'
            })
        serializer = CrossSerializer(crossData, many=True)
        return Response(serializer.data)
