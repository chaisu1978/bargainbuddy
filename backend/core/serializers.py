from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field

from rest_framework import serializers
from .models import User, Store, Region


class StoreSerializer(serializers.ModelSerializer):
    """Serializer for the Store model."""

    class Meta:
        model = Store
        fields = ['id', 'name', 'address']

class RegionSerializer(serializers.ModelSerializer):
    """Serializer for the Region model."""

    class Meta:
        model = Region
        fields = ['region']

class UserSerializer(serializers.ModelSerializer):
    preferred_stores = StoreSerializer(many=True, read_only=True)
    preferred_region = RegionSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            'email',
            'first_name',
            'last_name',
            'phone_number',
            'profile_picture',
            'preferred_stores',
            'preferred_region',
            'email_notifications',
            'push_notifications',
            'theme_mode',
            'is_superuser',
        ]

    def validate_email(self, value):
        user = self.instance
        if User.objects.filter(email=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value


class UpdateRegionSerializer(serializers.Serializer):
    region = serializers.CharField(required=True)


class PublicTokenSerializer(serializers.Serializer):
    """Serializer for the PublicTokenView."""
    access = serializers.CharField()

class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing user passwords."""
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    confirm_password = serializers.CharField(required=True)

class RegisterUserSerializer(serializers.Serializer):
    """Serializer for registering a new user."""
    email = serializers.EmailField(required=True)
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)


class RemovePreferredStoreSerializer(serializers.Serializer):
    store_id = serializers.IntegerField()

    def validate_store_id(self, value):
        # Validate that the store exists
        if not Store.objects.filter(id=value).exists():
            raise serializers.ValidationError("Store not found.")
        return value


class AddPreferredStoreSerializer(serializers.Serializer):
    store_id = serializers.IntegerField()

    def validate_store_id(self, value):
        if not Store.objects.filter(id=value).exists():
            raise serializers.ValidationError("Store not found.")
        return value


class ProfileImageUploadSerializer(serializers.Serializer):
    """Serializer for uploading a profile image"""
    profile_picture = serializers.ImageField()
