from rest_framework import filters, status
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView, ListAPIView, RetrieveDestroyAPIView
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAdminUser
from .serializers import PriceListUploadSerializer, WebminUserSerializer, PriceListImportHistorySerializer, UndoPriceListImportSerializer, WebminPriceListingSerializer
from django.contrib.auth import get_user_model
from core.models import Region, PriceListImportHistory, PriceListing
from .utils import (
    extract_sheet_data, process_product_import, process_store_import,
    process_price_import, log_import_history, detect_header_row
)
from django.db import transaction
import pandas as pd
from django.utils.timezone import now

User = get_user_model()

class PriceListUploadView(APIView):
    permission_classes = [IsAdminUser]
    serializer_class = PriceListUploadSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            file = serializer.validated_data["file"]
            date_added = serializer.validated_data.get("date_added", now())

            try:
                xl = pd.ExcelFile(file)
                sheet_names = [s for s in xl.sheet_names if s.strip().lower() not in ["sheet1", "sheet6"]]
                unresolved_stores = []
                skipped_sheets = []

                # Create regions
                for sheet in sheet_names:
                    Region.objects.get_or_create(region=sheet.strip().title())

                # Extract products from first sheet
                first_sheet = xl.parse(sheet_names[0])
                header_row = detect_header_row(first_sheet)
                first_sheet.columns = first_sheet.iloc[header_row].tolist()
                first_sheet = first_sheet.iloc[header_row + 1:, :]
                products_df = first_sheet.iloc[:, :4].rename(
                    columns={"No.": "Product_ID", "ITEMS": "Item", "BRAND": "Brand", "SIZE": "Size"}
                )
                process_product_import(products_df)

                # Process each sheet
                for sheet in sheet_names:
                    df = xl.parse(sheet)
                    region_name = sheet.strip().title()
                    region = Region.objects.get(region=region_name)

                    try:
                        _, stores_df, price_instances_df = extract_sheet_data(sheet, df)
                        unresolved_stores.extend(process_store_import(stores_df, region))
                        process_price_import(price_instances_df, region, date_added)
                    except Exception as e:
                        skipped_sheets.append({"sheet": sheet, "error": str(e)})

                log_import_history(file.name, request.user, True, date_added, f"Processed {len(sheet_names)} sheets.")

                return Response({
                    "message": "File processed successfully.",
                    "unresolved_stores": unresolved_stores,
                    "skipped_sheets": skipped_sheets,
                })
            except Exception as e:
                return Response({"error": str(e)}, status=500)

        return Response(serializer.errors, status=400)


class UserPagination(PageNumberPagination):
    """Custom pagination for users (defaults to 48 per page)"""
    page_size = 48
    page_size_query_param = "page_size"
    max_page_size = 100  # Prevent excessive data loads


class UserListCreateView(ListCreateAPIView):
    """
    GET /users/  => list (with search + pagination)
    POST /users/ => create user
    """
    queryset = User.objects.all().order_by('email')
    serializer_class = WebminUserSerializer
    permission_classes = [IsAdminUser]
    pagination_class = UserPagination
    filter_backends = [filters.SearchFilter]
    search_fields = ["email", "first_name", "last_name"]


class UserDetailView(RetrieveUpdateDestroyAPIView):
    """
    GET /users/<id>/ => retrieve
    PATCH/PUT /users/<id>/ => update
    DELETE /users/<id>/ => destroy
    """
    queryset = User.objects.all().order_by('email')
    serializer_class = WebminUserSerializer
    permission_classes = [IsAdminUser]
    lookup_field = "id"


class PriceListImportHistoryListView(ListAPIView):
    """List all price list import history records."""
    queryset = PriceListImportHistory.objects.all().order_by('-date_imported')
    serializer_class = PriceListImportHistorySerializer
    permission_classes = [IsAdminUser]

class UndoPriceListImportView(RetrieveDestroyAPIView):
    """Undo a price list import by removing related prices."""
    queryset = PriceListImportHistory.objects.all()
    serializer_class = UndoPriceListImportSerializer  # ✅ Now using a serializer
    permission_classes = [IsAdminUser]
    lookup_field = 'id'

    def delete(self, request, *args, **kwargs):
        instance = self.get_object()

        with transaction.atomic():
            # Delete associated price listings
            deleted_count, _ = PriceListing.objects.filter(date_added=instance.date_imported).delete()
            instance.delete()

        return Response(
            {
                "message": "Import record and associated prices removed successfully.",
                "deleted_prices": deleted_count,
                "deleted_import_id": instance.id,
            },
            status=status.HTTP_200_OK
        )


class PriceListingPagination(PageNumberPagination):
    """Custom pagination (defaults to 50 per page)."""
    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 100


class PriceListingWebminViewSet(ModelViewSet):
    """
    Manages PriceListing objects for the Webmin interface
    (e.g. allowing staff to approve/reject, bulk delete, etc.).
    """
    queryset = PriceListing.objects.select_related('product', 'store').order_by('-date_added')
    serializer_class = WebminPriceListingSerializer
    permission_classes = [permissions.IsAdminUser]

    pagination_class = PriceListingPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    # We'll search by related product fields:
    search_fields = ['product__brand', 'product__name', 'product__amount', 'store__name', 'store__address']
    ordering_fields = ['product__brand', 'product__name', 'product__amount', 'store__name', 'store__address']
