from django.urls import path, include
from rest_framework.routers import DefaultRouter
from store import views

router = DefaultRouter()
router.register('store', views.StoreViewSet, basename='store')
router.register('store-img-verified', views.StoreImgVerifiedViewSet, basename='store-img-verified')

app_name = 'store'

urlpatterns = [
    path('', include(router.urls)),
]
