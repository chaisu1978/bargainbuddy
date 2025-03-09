from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.authentication import CustomJWTAuthentication
from product.permissions import IsStaffOrReadOnly
from core.models import Product
from product import serializers
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter
# from action.action_brain import user_action
from rest_framework.pagination import PageNumberPagination

class ProductPagination(PageNumberPagination):
    """Custom pagination for Products (defaults to 50 per page)"""
    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 100  # Prevent excessive data loads


class ProductViewSet(viewsets.ModelViewSet):
    """View for managing product APIs."""
    serializer_class = serializers.ProductDetailSerializer
    queryset = Product.objects.all().order_by('date_added')
    filter_backends = [DjangoFilterBackend, SearchFilter]
    # filterset_fields = ['barcode', 'category', 'brand', 'manufacturer', 'img_is_verified']
    search_fields = ['name', 'description', 'amount', 'category', 'brand', 'manufacturer', 'barcode']
    authentication_classes = [CustomJWTAuthentication]
    ordering_fields = ['name', 'amount', 'category', 'brand', 'manufacturer', 'barcode']
    default_ordering = ['name']
    pagination_class = ProductPagination


    def get_permissions(self):
        """
        Custom permissions for different methods.
        """
        if self.action in ['list', 'retrieve']:  # Allow public access to GET methods
            return [permissions.AllowAny()]
        elif self.action == 'upload_image':
            return [permissions.IsAuthenticated()]
        else:
            return [permissions.IsAuthenticated(), IsStaffOrReadOnly()]

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        return response

    @action(detail=True, methods=['PUT'], serializer_class=serializers.ProductImageSerializer)
    def upload_image(self, request, pk=None):
        product = self.get_object()
        serializer = self.get_serializer(product, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProductImgVerifiedViewSet(viewsets.ModelViewSet):
    """View for updating img_is_verified field."""
    http_method_names = ['patch']
    serializer_class = serializers.ProductImgVerifiedSerializer
    queryset = Product.objects.all()
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated, IsStaffOrReadOnly]

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        # user_action(request.user, 'product image verification', {'data': [serializer.data, instance.id]})
        return Response(serializer.data, status=status.HTTP_200_OK)
