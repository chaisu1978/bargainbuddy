from rest_framework import serializers
from core.models import PriceListImportHistory, PriceListing
from django.contrib.auth import get_user_model

User = get_user_model()

class PriceListUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    date_added = serializers.DateTimeField()


class WebminUserSerializer(serializers.ModelSerializer):
    # Write-only fields for password creation
    password = serializers.CharField(write_only=True, required=False)
    confirm_password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "address",
            "profile_picture",
            "is_active",
            "is_superuser",
            "password",
            "confirm_password",
        ]

    def validate(self, attrs):
        """
        Ensure passwords match if provided,
        or raise a ValidationError.
        """
        pw = attrs.get("password")
        cpw = attrs.get("confirm_password")
        if pw or cpw:  # If either is present
            if pw != cpw:
                raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        """
        Handle user creation with password setting.
        """
        password = validated_data.pop("password", None)
        validated_data.pop("confirm_password", None)

        # Example: ensure email uniqueness
        email = validated_data["email"]
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError({"email": "A user with this email already exists."})

        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        """
        Handle partial update. Remove profile_picture if read-only,
        or handle it how you'd like.
        """
        validated_data.pop("confirm_password", None)
        password = validated_data.pop("password", None)

        # If you don't want to patch profile_picture:
        validated_data.pop("profile_picture", None)

        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user


class PriceListImportHistorySerializer(serializers.ModelSerializer):
    imported_by = serializers.SerializerMethodField()

    class Meta:
        model = PriceListImportHistory
        fields = ['id', 'file_name', 'date_imported', 'success', 'message', 'imported_by']

    def get_imported_by(self, obj):
        if obj.imported_by:
            return {'id': obj.imported_by.id, 'email': obj.imported_by.email}
        return None


class UndoPriceListImportSerializer(serializers.ModelSerializer):
    class Meta:
        model = PriceListImportHistory
        fields = ['id', 'file_name', 'date_imported', 'success', 'message']


class WebminPriceListingSerializer(serializers.ModelSerializer):
    product_brand = serializers.CharField(source='product.brand', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_amount = serializers.CharField(source='product.amount', read_only=True)
    store_name = serializers.CharField(source='store.name', read_only=True)
    store_address = serializers.CharField(source='store.address', read_only=True)

    # Force DRF to return a float instead of a string
    price = serializers.SerializerMethodField()

    class Meta:
        model = PriceListing
        fields = [
            'id',
            'date_added',
            'product_brand',
            'product_name',
            'product_amount',
            'store_name',
            'store_address',
            'price',
            'price_is_verified',
        ]
        read_only_fields = [
            'id', 'date_added', 'product_brand', 'product_name', 'product_amount', 'store_name', 'store_address'
        ]

    def get_price(self, obj):
        return float(obj.price) if obj.price is not None else None
