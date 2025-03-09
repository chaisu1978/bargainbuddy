"""
Database Models.
"""
import uuid
import os

from django.conf import settings
from django.db import models
from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin
)
import django.utils.timezone as timezone
from django.utils.timezone import now
from django.core.validators import MaxValueValidator, MinValueValidator


def product_image_file_path(instance, filename):
    """Generate file path for new product image."""
    ext = os.path.splitext(filename)[1]
    filename = f'{uuid.uuid4()}{ext}'

    return os.path.join('uploads', 'product', filename)


def store_image_file_path(instance, filename):
    """Generate file path for new store image."""
    ext = os.path.splitext(filename)[1]
    filename = f'{uuid.uuid4()}{ext}'

    return os.path.join('uploads', 'store_images', filename)


def profile_picture_file_path(instance, filename):
    """Generate file path for new profile picture."""
    ext = os.path.splitext(filename)[1]
    filename = f'{uuid.uuid4()}{ext}'

    return os.path.join('uploads', 'profile_pictures', filename)


def price_image_file_path(instance, filename):
    """Generate file path for new price image."""
    ext = os.path.splitext(filename)[1]
    filename = f'{uuid.uuid4()}{ext}'

    return os.path.join('uploads', 'price_images', filename)


class UserManager(BaseUserManager):
    """Custom manager for User model."""

    def create_user(
            self,
            email,
            first_name,
            last_name,
            password=None,
            **extra_fields
            ):
        """Create and return a regular user."""
        if not email:
            raise ValueError('The Email field must be set')
        if not first_name or not last_name:
            raise ValueError('First name and Last name fields must be set')
        email = self.normalize_email(email).lower()
        user = self.model(
            email=email,
            first_name=first_name,
            last_name=last_name,
            **extra_fields
            )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(
            self,
            email,
            first_name,
            last_name,
            password=None,
            **extra_fields
            ):
        """Create and return a superuser."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(
            email,
            first_name,
            last_name,
            password,
            **extra_fields
            )


class UserRole(models.Model):
    """Model for user roles."""
    id = models.AutoField(primary_key=True)
    role_name = models.CharField(max_length=255, unique=True)

    def __str__(self) -> str:
        return self.role_name


class User(AbstractBaseUser, PermissionsMixin):
    """Custom User model with additional fields."""
    email = models.EmailField(max_length=255, unique=True)
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=15, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    profile_picture = models.ImageField(
        upload_to=profile_picture_file_path,
        null=True,
        blank=True
    )
    preferred_stores = models.ManyToManyField(
    'Store',
        blank=True
        )
    preferred_region = models.ForeignKey(
        'Region',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
        )
    email_notifications = models.BooleanField(default=False)
    push_notifications = models.BooleanField(default=False)
    points = models.IntegerField(default=0)
    roles = models.ManyToManyField(
        'UserRole',
        related_name='users',
        blank=True
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    number_logins = models.PositiveIntegerField(default=0)
    profile_updated = models.BooleanField(default=False)
    profile_picture_updated = models.BooleanField(default=False)
    theme_mode = models.CharField(
        max_length=20,
        choices=[("light", "Light"), ("dark", "Dark")],
        default="light"
    )

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    def __str__(self):
        return self.email

    @property
    def username(self):
        return self.email

class DataSources(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)

    def __str__(self) -> str:
        return self.name


class Product(models.Model):
    IMG_VERIFIED_CHOICES = [
        ('pending', 'Pending'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    ]
    barcode = models.CharField(max_length=20, unique=True, null=True, blank=True)
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    amount = models.CharField(max_length=255, null=True, blank=True)
    brand = models.CharField(max_length=255, null=True, blank=True)
    category = models.CharField(max_length=255, null=True, blank=True)
    manufacturer = models.CharField(max_length=255, null=True, blank=True)
    image_url = models.URLField(null=True, blank=True)
    image = models.ImageField(
        null=True,
        blank=True,
        upload_to=product_image_file_path
        )
    img_is_verified = models.CharField(
        max_length=10,
        choices=IMG_VERIFIED_CHOICES,
        default='pending'
        )
    option1name = models.CharField(max_length=255, null=True, blank=True)
    option1value = models.CharField(max_length=255, null=True, blank=True)
    option2name = models.CharField(max_length=255, null=True, blank=True)
    option2value = models.CharField(max_length=255, null=True, blank=True)
    option3name = models.CharField(max_length=255, null=True, blank=True)
    option3value = models.CharField(max_length=255, null=True, blank=True)
    option4name = models.CharField(max_length=255, null=True, blank=True)
    option4value = models.CharField(max_length=255, null=True, blank=True)
    option5name = models.CharField(max_length=255, null=True, blank=True)
    option5value = models.CharField(max_length=255, null=True, blank=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True
    )
    source = models.ForeignKey(
        DataSources,
        on_delete=models.SET_NULL,
        null=True, blank=True
    )
    date_added = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Check if the instance is new or if the image field has been updated
        is_new = False
        if self.pk is None:
            is_new = True
        else:
            old_instance = Product.objects.get(pk=self.pk)
            if old_instance.image != self.image:
                is_new = True

        super().save(*args, **kwargs)

        if is_new and self.image:
            self.image_url = f"{settings.DOMAIN}{self.image.url}"
            super().save(update_fields=['image_url'])

    def delete(self, *args, **kwargs):
        if self.image:
            if os.path.isfile(self.image.path):
                os.remove(self.image.path)
        super().delete(*args, **kwargs)

    def __str__(self) -> str:
        return self.name


class Region(models.Model):
    region = models.CharField(max_length=255)

    def __str__(self) -> str:
        return self.region


class Store(models.Model):
    IMG_VERIFIED_CHOICES = [
        ('pending', 'Pending'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    ]
    name = models.CharField(max_length=255)
    address = models.TextField(null=True, blank=True)
    lat = models.DecimalField(max_digits=9, decimal_places=7)
    lon = models.DecimalField(max_digits=9, decimal_places=7)
    image = models.ImageField(
        upload_to=store_image_file_path,
        null=True,
        blank=True
        )
    img_is_verified = models.CharField(
        max_length=10,
        choices=IMG_VERIFIED_CHOICES,
        default='pending'
        )
    phone_number = models.CharField(max_length=15, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    website = models.URLField(null=True, blank=True)
    opening_hours = models.CharField(
        max_length=255,
        null=True,
        blank=True
        )
    region = models.ForeignKey(
        Region,
        on_delete=models.CASCADE,
        null=True,
        blank=True
        )
    store_type = models.CharField(max_length=255, null=True, blank=True)
    parking_availability = models.CharField(
        max_length=255,
        null=True,
        blank=True
        )
    wheelchair_accessible = models.CharField(
        max_length=255,
        null=True,
        blank=True
        )
    additional_info = models.TextField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True
    )
    source = models.ForeignKey(
        DataSources,
        on_delete=models.SET_NULL,
        null=True, blank=True
    )
    date_added = models.DateTimeField(auto_now_add=True)

    def delete(self, *args, **kwargs):
        if self.image:
            if os.path.isfile(self.image.path):
                os.remove(self.image.path)
        super().delete(*args, **kwargs)

    def __str__(self) -> str:
        return self.name


class PriceListing(models.Model):
    PRICE_VERIFIED_CHOICES = [
        ('pending', 'Pending'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    ]
    IMG_VERIFIED_CHOICES = [
        ('pending', 'Pending'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    ]
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    store = models.ForeignKey(Store, on_delete=models.CASCADE)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    price_is_verified = models.CharField(
            max_length=10,
            choices=PRICE_VERIFIED_CHOICES,
            default='pending'
        )
    price_image = models.ImageField(
        upload_to=price_image_file_path,
        null=True,
        blank=True
        )
    img_is_verified = models.CharField(
        max_length=10,
        choices=IMG_VERIFIED_CHOICES,
        default='pending'
        )
    source = models.ForeignKey(
            DataSources,
            on_delete=models.SET_NULL,
            null=True,
            blank=True
        )
    date_added = models.DateTimeField(default=timezone.now)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True
    )

    def delete(self, *args, **kwargs):
        if self.price_image:
            if os.path.isfile(self.price_image.path):
                os.remove(self.price_image.path)
        super().delete(*args, **kwargs)

    class Meta:
        indexes = [
            models.Index(fields=['product', 'store', 'date_added']),
        ]

    def __str__(self) -> str:
        if self.product.amount:
            return f"{self.product.amount} {self.product} - {self.store}"
        else:
            return f"{self.product} - {self.store}"


class Review(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
    )
    content = models.TextField(null=True, blank=True)
    rating = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
        )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        null=True,
        blank=True
        )
    product_listing = models.ForeignKey(
        PriceListing,
        on_delete=models.CASCADE,
        null=True,
        blank=True
        )
    store = models.ForeignKey(
        Store,
        on_delete=models.CASCADE,
        null=True,
        blank=True
        )
    date_added = models.DateTimeField(default=timezone.now)

    def __str__(self) -> str:
        return self.user


class ShoppingList(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
    )
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    last_updated = models.DateTimeField(default=now)

    def save(self, *args, **kwargs):
        self.last_updated = now()
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.user} - {self.name}"


class ShoppingListItem(models.Model):
    shopping_list = models.ForeignKey(ShoppingList, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    store = models.ForeignKey(Store, on_delete=models.CASCADE)
    is_needed = models.BooleanField(default=True)
    date_added = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.shopping_list} - {self.product} - {self.store}"


class AnalyticsReport(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
    )
    parameters = models.JSONField()
    filters = models.JSONField()
    report_data = models.JSONField()

    def __str__(self) -> str:
        return self.user


class UserAction(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
    )
    action_type = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)
    additional_data = models.JSONField(null=True, blank=True)

    def __str__(self) -> str:
        return f"{self.user} - {self.action_type}"


class Notification(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
    )
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    notification_type = models.CharField(max_length=255)

    def __str__(self) -> str:
        return self.user


class Submission(models.Model):
    SUBMISSION_TYPE_CHOICES = [
        ('product', 'Product'),
        ('store', 'Store'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    store = models.ForeignKey(
        Store,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    submission_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=255,  # Increase the max length
        choices=STATUS_CHOICES,
        default='pending'
    )
    notes = models.TextField(null=True, blank=True)
    submission_type = models.CharField(
        max_length=255,  # Increase the max length
        choices=SUBMISSION_TYPE_CHOICES,
        default='product'
    )
    data = models.JSONField(null=True, blank=True)

    def __str__(self) -> str:
        return f"{self.user} - {self.status}"


class Badge(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()

    def __str__(self) -> str:
        return self.name


class UserBadge(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
    )
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE)
    date_earned = models.DateTimeField(default=timezone.now)

    def __str__(self) -> str:
        return f"{self.user} - {self.badge}"


class PointsAction(models.Model):
    activity_type = models.CharField(max_length=255)
    point_amount = models.IntegerField()
    badge = models.ForeignKey(
        Badge,
        on_delete=models.CASCADE,
        null=True, blank=True
        )
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.activity_type} - {self.point_amount} pts"


class UserPoint(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
        )
    # What default value should we use here?

    points_action = models.ForeignKey(
        PointsAction, on_delete=models.CASCADE
    )
    timestamp = models.DateTimeField(default=timezone.now)

    def __str__(self) -> str:
        return f"{self.user} - {self.points_action}"


class UnresolvedBarcode(models.Model):
    barcode = models.CharField(max_length=255, unique=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
    )

    def __str__(self) -> str:
        return self.barcode


class PriceListImportHistory(models.Model):
    file_name = models.CharField(max_length=255)
    imported_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    date_imported = models.DateTimeField(default=timezone.now)
    success = models.BooleanField()
    message = models.TextField()


class UserSearchHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="search_history")
    query = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.query + ' - ' + self.user.email

    class Meta:
        ordering = ['-timestamp']
