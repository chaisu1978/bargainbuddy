from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from core.authentication import CustomJWTAuthentication
from core.models import ShoppingList, ShoppingListItem, Product, Store
from shoppinglist import serializers, permissions as custom_permissions
from action.action_brain import user_action


class ShoppingListViews(viewsets.ModelViewSet):
    """Manage ShoppingLists in the database."""
    serializer_class = serializers.ShoppingListSerializer
    queryset = ShoppingList.objects.all()
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated, custom_permissions.IsCreatorOrReadOnly]

    def perform_create(self, serializer):
        """Create a new shopping list."""
        serializer.save(user=self.request.user)
        # Record user action for new shopping list creation
        user_action(self.request.user, 'new shopping list', serializer.data)

    def get_queryset(self):
        """Return the shopping lists for the current authenticated user."""
        return self.queryset.filter(user=self.request.user).order_by('-last_updated')


from django.utils.timezone import now

class ShoppingListItemViews(viewsets.ModelViewSet):
    """Manage ShoppingListItems in the database."""
    serializer_class = serializers.ShoppingListItemSerializer
    queryset = ShoppingListItem.objects.all()
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated, custom_permissions.IsCreatorOrReadOnly]

    def perform_create(self, serializer):
        """Create a new shopping list item."""
        shopping_list_id = self.request.data.get('shopping_list')
        product_id = self.request.data.get('product')
        store_id = self.request.data.get('store')

        # Validate shopping list ownership
        shopping_list = ShoppingList.objects.get(id=shopping_list_id, user=self.request.user)

        # Validate product and store existence
        product = Product.objects.get(id=product_id)
        store = Store.objects.get(id=store_id)

        # Save the shopping list item
        serializer.save(shopping_list=shopping_list, product=product, store=store)

        # Update the `last_updated` field of the associated shopping list
        shopping_list.last_updated = now()
        shopping_list.save()

        # Record user action for new shopping list item creation
        user_action(self.request.user, 'new shopping list item', serializer.data)

    def perform_update(self, serializer):
        """Update a shopping list item."""
        shopping_list_item = serializer.instance  # The specific ShoppingListItem being updated
        shopping_list = shopping_list_item.shopping_list  # Fetch the related ShoppingList

        # Validate that the user owns the related ShoppingList
        if shopping_list.user != self.request.user:
            raise serializers.ValidationError("You do not have permission to modify this item.")

        # Save the updated fields
        serializer.save()

        # Update the `last_updated` field of the associated shopping list
        shopping_list.last_updated = now()
        shopping_list.save()

        # Record user action for shopping list item update
        user_action(self.request.user, 'shopping list item update', serializer.data)

    def get_queryset(self):
        """Return the shopping list items for the current authenticated user."""
        queryset = self.queryset.filter(shopping_list__user=self.request.user)

        # Filter by shopping_list ID if provided in the query parameters
        shopping_list_id = self.request.query_params.get('shopping_list')
        if shopping_list_id:
            queryset = queryset.filter(shopping_list__id=shopping_list_id)

        return queryset.order_by('-date_added')


