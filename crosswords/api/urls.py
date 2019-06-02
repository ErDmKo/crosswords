from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'words', views.WordList)

urlpatterns = [
    path('', include(router.urls)),
    path('crossword', views.GenCross.as_view(), name='crossword'),
]
