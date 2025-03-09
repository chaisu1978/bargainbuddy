from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from core import models


class UserAdmin(BaseUserAdmin):
    """Define the admin pages for users."""
    ordering = ['id']
    list_display = ['email', 'first_name', 'last_name']
    fieldsets = (
        (None, {'fields': ('email', 'password', 'first_name', 'last_name')}),
        (
            _('Personal info'),
            {
                'fields': (
                    'phone_number',
                    'address',
                    'profile_picture',
                )
            }
        ),
        (
            _('Permissions'),
            {
                'fields': (
                    'is_active',
                    'is_staff',
                    'is_superuser',
                    'roles',  # Use roles instead of groups
                )
            }
        ),
        (
            _('Notifications & Points'),
            {
                'fields': (
                    'preferred_region',
                    'preferred_stores',
                    'email_notifications',
                    'push_notifications',
                    'points',
                )
            }
        ),
        (_('Important dates'), {'fields': ('last_login',)}),
    )

    readonly_fields = ['last_login']
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'email',
                'first_name',
                'last_name',
                'password1',
                'password2',
                'phone_number',
                'address',
                'profile_picture',
                'email_notifications',
                'push_notifications',
                'is_active',
                'is_staff',
                'is_superuser',
                'roles',  # Use roles instead of groups
            )
        }),
    )


# Register models with the admin site
admin.site.register(models.UserRole)
admin.site.register(models.User, UserAdmin)
admin.site.register(models.Product)
admin.site.register(models.Region)
admin.site.register(models.Store)
admin.site.register(models.PriceListing)
admin.site.register(models.Review)
admin.site.register(models.ShoppingList)
admin.site.register(models.ShoppingListItem)
admin.site.register(models.AnalyticsReport)
admin.site.register(models.UserAction)
admin.site.register(models.Notification)
admin.site.register(models.Submission)
admin.site.register(models.Badge)
admin.site.register(models.UserBadge)
admin.site.register(models.PointsAction)
admin.site.register(models.UserPoint)
admin.site.register(models.UnresolvedBarcode)
admin.site.register(models.PriceListImportHistory)
admin.site.register(models.DataSources)
admin.site.register(models.UserSearchHistory)
