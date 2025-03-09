from rest_framework import permissions
from core.models import ShoppingListItem, ShoppingList


class IsCreatorOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow creators of an object to edit it.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD, or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the creator of the object.
        if isinstance(obj, ShoppingListItem):
            return obj.shopping_list.user == request.user
        elif isinstance(obj, ShoppingList):
            return obj.user == request.user
        else:
            # Deny permission for other object types
            return False
