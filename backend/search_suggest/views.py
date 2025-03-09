import re
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from core.authentication import CustomJWTAuthentication
from core.models import UserSearchHistory, Product, Store
from .serializers import (
    SearchStoreSerializer,
    SearchProductSerializer,
    UserSearchHistorySerializer,
    SearchSuggestionsSerializer,
)


@extend_schema(
    parameters=[
        OpenApiParameter(
            name="query",
            description="Search query string.",
            required=False,
            type=str,
            examples=[
                OpenApiExample("Example Search", value="apple"),
            ],
        ),
        OpenApiParameter(
            name="type",
            description="Type of suggestions to retrieve. Options are 'store', 'product', 'history', or 'all'.",
            required=False,
            type=str,
            enum=["store", "product", "history", "all"],
            default="all",
        ),
        OpenApiParameter(
            name="include_history",
            description="Whether to include user search history in the results. Defaults to true.",
            required=False,
            type=bool,
            default=True,
        ),
        OpenApiParameter(
            name="include_products",
            description="Whether to include product suggestions in the results. Defaults to true.",
            required=False,
            type=bool,
            default=True,
        ),
        OpenApiParameter(
            name="include_stores",
            description="Whether to include store suggestions in the results. Defaults to true.",
            required=False,
            type=bool,
            default=True,
        ),
    ],
    responses={200: SearchSuggestionsSerializer},
    tags=["Search Suggestions"],
)
class SearchSuggestionsView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [AllowAny]
    serializer_class = SearchSuggestionsSerializer

    def split_query_terms(self, query):
        stopwords = {"in", "at", "on", "and", "or", "for", "the", "a", "an", "of", "with", "to", "from", "by"}
        terms = re.split(r'\s+', query)
        return [term for term in terms if term.lower() not in stopwords]

    def get(self, request):
        query = request.GET.get("query", "").strip()
        suggestion_type = request.GET.get("type", "all")
        include_history = request.GET.get("include_history", "true").lower() == "true"
        include_products = request.GET.get("include_products", "true").lower() == "true"
        include_stores = request.GET.get("include_stores", "true").lower() == "true"

        terms = self.split_query_terms(query)
        results = {}

        # Suggest stores
        if suggestion_type in ["all", "store"] and include_stores:
            store_queryset = Store.objects.none()
            for term in terms:
                store_queryset |= Store.objects.filter(
                    name__icontains=term
                ) | Store.objects.filter(
                    address__icontains=term
                ) | Store.objects.filter(
                    region__region__icontains=term
                )
            stores = store_queryset.distinct()[:10]
            results["stores"] = [{"id": store.id, "name": store.name, "address": store.address} for store in stores]

        # Suggest products
        if suggestion_type in ["all", "product"] and include_products:
            product_queryset = Product.objects.none()
            for term in terms:
                product_queryset |= Product.objects.filter(
                    name__icontains=term
                ) | Product.objects.filter(
                    brand__icontains=term
                ) | Product.objects.filter(
                    amount__icontains=term
                )
            products = product_queryset.distinct()[:10]
            results["products"] = [
                {"id": product.id, "name": product.name, "brand": product.brand, "amount": product.amount}
                for product in products
            ]

        # Suggest user history
        if suggestion_type in ["all", "history"] and include_history:
            if request.user and request.user.is_authenticated:
                history_queryset = UserSearchHistory.objects.none()
                for term in terms:
                    history_queryset |= UserSearchHistory.objects.filter(
                        user=request.user, query__icontains=term
                    )
                history = history_queryset.order_by("-timestamp").distinct()[:10]
                results["history"] = [
                    {"id": record.id, "query": record.query, "timestamp": record.timestamp}
                    for record in history
                ]
            else:
                results["history"] = []

        return Response(results)
