from django.views import generic
from .models import Word


class WikiApi(generic.TemplateView):
    template_name = 'crosswords/wiki_info.html'

    def get_context_data(self, **kw):
        context = super().get_context_data(**kw)
        context['object_list'] = Word.rnd.wikiRnd(20)
        return context

class LetterIndex(generic.TemplateView):
    template_name = 'crosswords/word_letter.html'
    start_letter = 'а'
    end_letter = 'я'

    def get_context_data(self, **kw):
        context = super().get_context_data(**kw)
        obj_list = [{ 'id': no, 'chr': chr(no) } \
            for no in range(
                ord(self.start_letter),
                ord(self.end_letter) + 1) 
        ]
        context['obj_list'] = obj_list
        return context

class IndexView(generic.ListView):
    paginate_by = 30
    model = Word

    def get_context_data(self, **kw):
        context = super().get_context_data(**kw)
        context['letter'] = chr(self.kwargs['chr'])
        return context


    def get_queryset(self):
        qs = super().get_queryset()
        return qs.filter(word__startswith=chr(self.kwargs['chr']))


class DetailView(generic.DetailView):
    model = Word
