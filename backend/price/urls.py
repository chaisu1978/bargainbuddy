from django.urls import path, include
from rest_framework.routers import DefaultRouter
from price import views

router = DefaultRouter()
router.register('price', views.PriceViewSet, basename='price')
router.register('price-verification', views.PriceVerificationViewSet, basename='price-verification')

app_name = 'price'

urlpatterns = [
    path('', include(router.urls)),
    path('price-history/<int:pk>/', views.PriceHistoryView.as_view(), name='price-history'),  # New endpoint
]
