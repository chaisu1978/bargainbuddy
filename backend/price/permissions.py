from rest_framework import permissions


class IsStaffOrReadOnly(permissions.BasePermission):
    """
    Custom permission to allow only staff members to edit/delete objects,
    while authenticated users can create objects and upload images for
    the stores they created.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True

        if request.method == 'POST' and request.user.is_authenticated:
            return True

        return request.user.is_authenticated and request.user.is_staff

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        # Allow the creator of the price listing to update the image
        if view.action == 'price_image_upload' and obj.created_by == request.user:  # noqa: E501
            return True

        return request.user.is_authenticated and request.user.is_staff
