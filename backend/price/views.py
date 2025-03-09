from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db.models import Max, Subquery, OuterRef, Count
from core.authentication import CustomJWTAuthentication
from price.permissions import IsStaffOrReadOnly
from core.models import PriceListing
from price import serializers
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter
from datetime import date, timedelta, datetime
from django.utils.timezone import make_aware
from django.utils import timezone

import re

STOPWORDS = {"in", "at", "on", "and", "or", "for", "the", "a", "an", "of", "with", "to", "from", "by"}
WILDCARD_TERMS = {"&"}


class CustomSearchFilter(SearchFilter):
    """
    A custom search filter that:
      1. Logs the original (raw) user query if authenticated,
      2. Removes stopwords and wildcard terms before DRF applies the query across 'search_fields'.
    """

    def filter_queryset(self, request, queryset, view):
        search_query = request.query_params.get(self.search_param, '')

        if request.user and request.user.is_authenticated and search_query:
            from core.models import UserSearchHistory
            record, created = UserSearchHistory.objects.get_or_create(
                user=request.user,
                query=search_query
            )
            if not created:
                # If a record with the same (user, query) already exists, 
                # just update the timestamp to "bump" it.
                record.timestamp = timezone.now()
                record.save()

        # Let SearchFilter handle the rest
        return super().filter_queryset(request, queryset, view)

    def get_search_terms(self, request):
        # 2. DRF calls this to get the list of terms. We remove stopwords and wildcard terms here.
        search_query = request.query_params.get(self.search_param, '')
        words = re.split(r'\s+', search_query.strip())
        cleaned_words = [
            word for word in words
            if word.lower() not in STOPWORDS and word not in WILDCARD_TERMS
        ]
        return cleaned_words


class PriceViewSet(viewsets.ModelViewSet):
    """View for managing price APIs."""
    serializer_class = serializers.PriceDetailSerializer
    queryset = PriceListing.objects.select_related('product', 'store__region')

    filter_backends = [DjangoFilterBackend, CustomSearchFilter]  # Our custom filter
    filterset_fields = ['store', 'product', 'product__barcode']

    # The fields DRF will attempt to search on using the cleaned terms:
    search_fields = [
        'store__name',
        'store__address',
        'store__region__region',
        'product__name',
        'product__brand',
        'product__amount',
        'price'
    ]

    authentication_classes = [CustomJWTAuthentication]

    def get_permissions(self):
        """
        Apply custom permissions based on the request method.
        """
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        elif self.action == 'price_image_upload':
            return [IsAuthenticated()]
        else:
            return [IsAuthenticated(), IsStaffOrReadOnly()]

    def get_queryset(self):
        """Customize queryset to filter by region and only return the latest price listings."""
        region = self.request.query_params.get('region', '').lower()
        ordering = self.request.query_params.get('ordering', '-date_added')  # default sorting

        # Base queryset
        base_queryset = PriceListing.objects.select_related('product', 'store__region')

        # Subquery to get the latest date for each product-store pair
        latest_date_subquery = PriceListing.objects.filter(
            product=OuterRef('product'),
            store=OuterRef('store')
        ).order_by('-date_added').values('date_added')[:1]

        # Filter the queryset to include only the latest price listings
        queryset = base_queryset.filter(
            date_added=Subquery(latest_date_subquery)
        )

        # Region filter (ignore if 'everywhere')
        if region and region != 'everywhere':
            queryset = queryset.filter(store__region__region__iexact=region)

        # Apply ordering
        if ordering:
            queryset = queryset.order_by(ordering)

        return queryset

    @action(
        detail=True,
        methods=['PUT'],
        serializer_class=serializers.PriceImageSerializer,
        permission_classes=[IsAuthenticated],
        url_path='price-image-upload'
    )
    def price_image_upload(self, request, pk=None):
        """Upload an image to a price listing."""
        price = self.get_object()
        serializer = self.get_serializer(price, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PriceVerificationViewSet(viewsets.ModelViewSet):
    """View for updating img_is_verified and price_is_verified."""
    http_method_names = ['patch']
    serializer_class = serializers.PriceVerificationSerializer
    queryset = PriceListing.objects.all()
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated, IsStaffOrReadOnly]

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)



class PriceHistoryView(APIView):
    """View for fetching price history."""
    permission_classes = [AllowAny]  # Public access by default
    serializer_class = serializers.PriceHistorySerializer

    def get(self, request, pk=None, *args, **kwargs):
        """Retrieve price history for a specific product and store."""
        try:
            # Fetch the target price listing
            target_price = PriceListing.objects.get(pk=pk)

            # Define start date for history
            start_date = make_aware(datetime(2023, 7, 1))

            # Fetch all price listings for the same product and store
            prices = PriceListing.objects.filter(
                product=target_price.product,
                store=target_price.store,
                date_added__gte=start_date
            ).order_by("date_added").values("date_added", "price")

            # Serialize the data
            serializer = serializers.PriceHistorySerializer(prices, many=True)

            return Response(serializer.data, status=status.HTTP_200_OK)
        except PriceListing.DoesNotExist:
            return Response(
                {"detail": "Price listing not found."}, status=status.HTTP_404_NOT_FOUND
            )
