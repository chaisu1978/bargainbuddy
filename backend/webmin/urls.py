from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    PriceListUploadView,  # existing
    UserListCreateView,
    UserDetailView,
    PriceListImportHistoryListView,
    UndoPriceListImportView,
    PriceListingWebminViewSet,  # <-- new
)

router = DefaultRouter()
# Existing routes:
router.register('price-listing', PriceListingWebminViewSet, basename='webmin-price-listing')

urlpatterns = [
    path('upload-price-list/', PriceListUploadView.as_view(), name='upload-price-list'),
    path("users/", UserListCreateView.as_view(), name="user-list-create"),
    path("users/<int:id>/", UserDetailView.as_view(), name="user-detail"),
    path("pricelistimporthistory/", PriceListImportHistoryListView.as_view(), name="price-list-import-history"),
    path("undo-mti-import/<int:id>/", UndoPriceListImportView.as_view(), name="undo-price-list-import"),
]

# Append router urls
urlpatterns += router.urls
