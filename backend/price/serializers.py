from rest_framework import serializers
from core.models import PriceListing
from django.conf import settings
from drf_spectacular.utils import extend_schema_field
from rest_framework.fields import CharField

class PriceSerializer(serializers.ModelSerializer):
    """Serializer for price listing."""

    class Meta:
        model = PriceListing
        fields = [
            'id', 'store', 'product', 'price',
            'date_added', 'price_is_verified', 'source',
        ]
        read_only_fields = ['id', 'date_added']

    def create(self, validated_data):
        """Create a new price listing."""
        price = PriceListing.objects.create(**validated_data)

        return price

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance


class PriceDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed price listing view."""
    product_id = serializers.IntegerField(source='product.id', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_brand = serializers.CharField(source='product.brand', read_only=True)
    product_amount = serializers.CharField(source='product.amount', read_only=True)
    product_image = serializers.SerializerMethodField()
    store_id = serializers.IntegerField(source='store.id', read_only=True)
    store_name = serializers.CharField(source='store.name', read_only=True)
    store_address = serializers.CharField(source='store.address', read_only=True)
    store_region = serializers.CharField(source='store.region.region', read_only=True)
    store_image = serializers.SerializerMethodField()
    store_lat = serializers.DecimalField(source='store.lat', max_digits=9, decimal_places=7, read_only=True)
    store_lon = serializers.DecimalField(source='store.lon', max_digits=9, decimal_places=7, read_only=True)
    price_is_verified = serializers.CharField(read_only=True)
    source = serializers.CharField(source='source.name', read_only=True)


    @extend_schema_field(CharField)
    def get_product_image(self, obj):
        """Return product image URL or placeholder."""
        return obj.product.image_url or "https://via.placeholder.com/150"

    @extend_schema_field(CharField)
    def get_store_image(self, obj):
        """Return store image URL or placeholder."""
        if obj.store.image:
            return f"{settings.DOMAIN}{obj.store.image.url}"
        else:
            return "https://via.placeholder.com/150"

    def to_representation(self, instance):
        """Clean up None or NaN values in the response."""
        data = super().to_representation(instance)
        for key, value in data.items():
            if value is None or (isinstance(value, float) and str(value) == 'nan'):
                data[key] = ""
        return data

    class Meta:
        model = PriceListing
        fields = [
            'id',
            'price',
            'price_is_verified',
            'source',
            'date_added',
            'product_id',
            'product_name',
            'product_brand',
            'product_amount',
            'product_image',
            'store_id',
            'store_name',
            'store_address',
            'store_region',
            'store_image',
            'store_lat',
            'store_lon',
        ]
        read_only_fields = ['id', 'date_added']


class PriceImageSerializer(serializers.ModelSerializer):
    """Serializer for uploading images to price listing."""

    class Meta:
        model = PriceListing
        fields = ['id', 'price_image']
        read_only_fields = ['id']
        extra_kwargs = {'price_image': {'required': True}}


class PriceVerificationSerializer(serializers.ModelSerializer):
    """Serializer for updating verification fields."""
    class Meta:
        model = PriceListing
        fields = ['id', 'img_is_verified', 'price_is_verified']
        read_only_fields = ['id']

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

class PriceHistorySerializer(serializers.Serializer):
    """Serializer for price history data."""
    date_added = serializers.DateTimeField()
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
