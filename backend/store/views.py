from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from core.authentication import CustomJWTAuthentication
from store.permissions import IsStaffOrReadOnly
from core.models import Store
from store import serializers
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter
from rest_framework.pagination import PageNumberPagination

class StorePagination(PageNumberPagination):
    """Custom pagination for users (defaults to 48 per page)"""
    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 100  # Prevent excessive data loads

class StoreViewSet(viewsets.ModelViewSet):
    """View for managing store APIs."""
    serializer_class = serializers.StoreDetailSerializer
    queryset = Store.objects.all().order_by('date_added')
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['region__region']
    search_fields = [
    'name',
    'address',
    'region__region'
]
    authentication_classes = [CustomJWTAuthentication]
    pagination_class = StorePagination

    def get_permissions(self):
        """
        Apply custom permissions based on the request method.
        """
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        elif self.action == 'store_image_upload':
            return [IsAuthenticated()]
        else:
            return [IsAuthenticated(), IsStaffOrReadOnly()]

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        return response

    @action(
        detail=True,
        methods=['PUT'],
        serializer_class=serializers.StoreImageSerializer,
        permission_classes=[IsAuthenticated],
        url_path='store-image-upload'
    )
    def store_image_upload(self, request, pk=None):
        """Upload an image to a store."""
        store = self.get_object()
        serializer = self.get_serializer(store, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StoreImgVerifiedViewSet(viewsets.ModelViewSet):
    """View for updating img_is_verified field."""
    http_method_names = ['patch']
    serializer_class = serializers.StoreImgVerifiedSerializer
    queryset = Store.objects.all()
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated, IsStaffOrReadOnly]

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
