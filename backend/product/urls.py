from django.urls import path, include
from rest_framework.routers import DefaultRouter
from product import views

router = DefaultRouter()
router.register('product', views.ProductViewSet, basename='product')
router.register('product-img-verified', views.ProductImgVerifiedViewSet, basename='product-img-verified')

app_name = 'product'

urlpatterns = [
    path('', include(router.urls)),
]
