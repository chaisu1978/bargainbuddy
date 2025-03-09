from django.urls import path
from .views import SearchSuggestionsView

urlpatterns = [
    path('search-suggest/', SearchSuggestionsView.as_view(), name='search-suggest'),
]
