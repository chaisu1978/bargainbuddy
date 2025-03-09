from rest_framework import serializers
from core.models import Review


class ReviewSerializer(serializers.ModelSerializer):
    """Serializer for Review objects."""

    class Meta:
        model = Review
        fields = (
            'id',
            'product',
            'store',
            'product_listing',
            'user',
            'rating',
            'content'
            )
        read_only_fields = ('id', 'user')


class ReviewDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed Review objects."""

    class Meta:
        model = Review
        fields = (
            'id',
            'product',
            'store',
            'product_listing',
            'user',
            'rating',
            'content'
            )
        read_only_fields = ('id', 'user')
