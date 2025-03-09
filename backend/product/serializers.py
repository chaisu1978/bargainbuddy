from rest_framework import serializers
from core.models import Product


class ProductSerializer(serializers.ModelSerializer):
    """Serializer for products."""

    class Meta:
        model = Product
        fields = [
            'id', 'barcode', 'name', 'amount',
            ]
        read_only_fields = ['id']

    def create(self, validated_data):
        """Create a new product."""
        product = Product.objects.create(**validated_data)

        return product

    def update(self, instance, validated_data):

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance


class ProductDetailSerializer(ProductSerializer):
    """Serializer for product detail view."""

    class Meta(ProductSerializer.Meta):
        fields = ProductSerializer.Meta.fields + [
            'description', 'brand', 'category',
            'manufacturer', 'image_url', 'option1name',
            'option1value', 'option2name', 'option2value',
            'option3name', 'option3value', 'option4name',
            'option4value', 'option5name', 'option5value',
            'img_is_verified',

            ]


class ProductImageSerializer(serializers.ModelSerializer):
    """Serializer for uploading images to product."""

    class Meta:
        model = Product
        fields = ['id', 'image']
        read_only_fields = ['id']
        extra_kwargs = {'image': {'required': 'True'}}


class ProductImgVerifiedSerializer(serializers.ModelSerializer):
    """Serializer for updating img_is_verified field."""

    class Meta:
        model = Product
        fields = ['id', 'name', 'img_is_verified']
        read_only_fields = ['id', 'name']

    def update(self, instance, validated_data):

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance
