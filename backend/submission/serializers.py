from rest_framework import serializers
from core.models import Submission


class SubmissionSerializer(serializers.ModelSerializer):
    """Serializer for submission."""

    class Meta:
        model = Submission
        fields = [
            'id', 'product', 'store', 'user', 'status', 'submission_type',
            'notes', 'data',
        ]
        read_only_fields = ['id', 'user', ]

    def create(self, validated_data):
        """Create a new submission."""
        submission = Submission.objects.create(**validated_data)

        return submission

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            if attr == 'data':
                # Assign a new dictionary to the JSONField
                instance.data = {**instance.data, **value}
            else:
                setattr(instance, attr, value)

        instance.save()

        # Check if the Submission has been approved and
        # update the associated Product or Store accordingly
        if instance.status == 'approved':
            if instance.submission_type == 'product' and instance.product is not None:  ## noqa
                for key, value in instance.data.items():
                    setattr(instance.product, key, value)
                instance.product.save()
            elif instance.submission_type == 'store' and instance.store is not None:  ## noqa
                for key, value in instance.data.items():
                    setattr(instance.store, key, value)
                instance.store.save()

        return instance


class SubmissionDetailSerializer(SubmissionSerializer):
    """Serializer for submission detail view."""

    class Meta(SubmissionSerializer.Meta):
        fields = SubmissionSerializer.Meta.fields + [
            'submission_date',
        ]
        read_only_fields = ['id', 'user', 'submission_date']
