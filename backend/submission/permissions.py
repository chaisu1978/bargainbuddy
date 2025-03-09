from rest_framework import permissions


class IsStaffOrReadOnly(permissions.BasePermission):
    """
    Custom permissions to allow only staff members to
    change status field of submissions, while
    authenticated users can create submissions as well as
    update their own submissions except for the status field.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_staff

        if request.method == 'POST' and request.user.is_authenticated:
            return True

        if request.method in ['PUT', 'PATCH']:
            if 'status' in request.data and not request.user.is_staff:
                return False

        return request.user.is_authenticated and request.user.is_staff

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_staff

        if request.method in ['PUT', 'PATCH']:
            # Only allow the owner to update the submission
            if obj.user == request.user:
                # If the user is trying to change the status, do not allow
                if 'status' in request.data and not request.user.is_staff:
                    return False
                return True

        return request.user.is_authenticated and request.user.is_staff
