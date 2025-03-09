from rest_framework import serializers
from core.models import Store, Product, UserSearchHistory

class SearchStoreSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(read_only=True)
    address = serializers.CharField(read_only=True)

    class Meta:
        model = Store
        fields = ["id", "name", "address"]

class SearchProductSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(read_only=True)
    amount = serializers.CharField(read_only=True)
    brand = serializers.CharField(read_only=True)

    class Meta:
        model = Product
        fields = ["id", "name", "amount", "brand"]


class UserSearchHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSearchHistory
        fields = ["id", "query", "timestamp"]  # Directly map to model fields

class SearchSuggestionsSerializer(serializers.Serializer):
    stores = SearchStoreSerializer(many=True, required=False)
    products = SearchProductSerializer(many=True, required=False)
    history = UserSearchHistorySerializer(many=True, required=False)
