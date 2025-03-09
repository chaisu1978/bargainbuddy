from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from core.authentication import CustomJWTAuthentication
from review.permissions import IsOwnerOrReadOnly
from core.models import Review
from review import serializers
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter
from action.action_brain import user_action

class ReviewViewSet(viewsets.ModelViewSet):
    """View for managing review APIs."""
    queryset = Review.objects.all()
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = [
        'user',
        'rating',
        'product',
        'product_listing',
        'store',
        'date_added',
    ]
    search_fields = [
        'content',
    ]
    authentication_classes = [CustomJWTAuthentication]

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
        elif self.action in ['create']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [AllowAny]
        return [permission() for permission in permission_classes]

    def get_serializer_class(self):
        if self.action in ['list', 'create', 'update', 'partial_update']:
            return serializers.ReviewSerializer
        return serializers.ReviewDetailSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        # Log user action for creating a new review
        additional_data = dict(self.request.data)
        user_action(self.request.user, 'new review', additional_data)
