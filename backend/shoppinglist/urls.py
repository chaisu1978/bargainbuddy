from django.urls import path, include, re_path
from rest_framework.routers import DefaultRouter
from shoppinglist import views

router = DefaultRouter()
router.register('shoppinglist', views.ShoppingListViews, basename='shoppinglist')
router.register('shoppinglistitem', views.ShoppingListItemViews, basename='shoppinglistitem')

app_name = 'shoppinglist'

urlpatterns = [
    path('', include(router.urls)),
    re_path(
        r'^shoppinglist/(?P<shopping_list_pk>\d+)/items/$',
        views.ShoppingListItemViews.as_view({'get': 'list'}),
        name='shoppinglistitem-nested'
    ),
]
