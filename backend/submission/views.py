from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.authentication import CustomJWTAuthentication
from submission.permissions import IsStaffOrReadOnly
from core.models import Submission
from submission import serializers
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter
from action.action_brain import user_action

class SubmissionViewSet(viewsets.ModelViewSet):
    """View for managing submission APIs."""
    queryset = Submission.objects.all()
    filter_backends = [DjangoFilterBackend, SearchFilter]
    # filterset_fields = ['submission_type', 'user', 'status']
    search_fields = ['product__name', 'store__name']
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated, IsStaffOrReadOnly]

    def get_serializer_class(self):
        if self.action in ['list', 'create', 'update', 'partial_update']:
            return serializers.SubmissionSerializer
        return serializers.SubmissionDetailSerializer

    @action(detail=True, methods=['patch'], url_path='data')
    def update_data(self, request, pk=None):
        """Update submission data."""
        submission = self.get_object()
        serializer = self.get_serializer(submission, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def perform_create(self, serializer):
        """Create a new submission."""
        serializer.save(user=self.request.user)
        user_action(self.request.user, 'new submission', serializer.data)

    def perform_update(self, serializer):
        """Update a submission."""
        submission = self.get_object()
        serializer.save()
        user_action(self.request.user, 'submission updated', {'data': [serializer.data, submission.id]})
