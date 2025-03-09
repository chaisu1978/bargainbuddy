from rest_framework import serializers
from core.models import Store, Region


class StoreSerializer(serializers.ModelSerializer):
    """Serializer for stores."""

    class Meta:
        model = Store
        fields = [
            'id', 'name', 'address', 'lat', 'lon',
        ]
        read_only_fields = ['id']

    def create(self, validated_data):
        """Create a new store."""
        store = Store.objects.create(**validated_data)

        return store

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance


class StoreDetailSerializer(StoreSerializer):
    """Serializer for store detail view."""
    region_name = serializers.CharField(source='region.region', read_only=True)
    region = serializers.CharField(write_only=True, required=False)  # Accepts region name

    class Meta(StoreSerializer.Meta):
        fields = StoreSerializer.Meta.fields + [
            'image', 'phone_number', 'email', 'website',
            'opening_hours', 'region', 'region_name', 'store_type',
            'parking_availability', 'wheelchair_accessible',
            'additional_info', 'date_added', 'img_is_verified',
        ]

    def create(self, validated_data):
        region_name = validated_data.pop('region', None)
        if region_name:  # Ensure region isn't empty
            region_obj, _ = Region.objects.get_or_create(region=region_name)
            validated_data['region'] = region_obj
        return super().create(validated_data)

    def update(self, instance, validated_data):
        region_name = validated_data.pop('region', None)
        if region_name:  # Ensure region isn't empty
            region_obj, _ = Region.objects.get_or_create(region=region_name)
            validated_data['region'] = region_obj
        return super().update(instance, validated_data)



class StoreImageSerializer(serializers.ModelSerializer):
    """Serializer for uploading images to store."""

    class Meta:
        model = Store
        fields = ['id', 'image']
        read_only_fields = ['id']
        extra_kwargs = {'image': {'required': 'True'}}


class StoreImgVerifiedSerializer(serializers.ModelSerializer):
    """Serializer for updating img_is_verified field."""

    class Meta:
        model = Store
        fields = ['id', 'name', 'img_is_verified']
        read_only_fields = ['id', 'name']

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance
