from rest_framework import serializers

from core.models import ShoppingList, ShoppingListItem


class ShoppingListSerializer(serializers.ModelSerializer):
    """Serializer for ShoppingList objects."""

    class Meta:
        model = ShoppingList
        fields = ('id', 'name', 'description', 'user', 'last_updated')
        read_only_fields = ('id', 'user')


class ShoppingListItemSerializer(serializers.ModelSerializer):
    """Serializer for ShoppingListItem objects."""

    class Meta:
        model = ShoppingListItem
        fields = (
            'id',
            'shopping_list',
            'product',
            'store',
            'is_needed',
            'date_added',
        )
        read_only_fields = ('id', 'date_added')


