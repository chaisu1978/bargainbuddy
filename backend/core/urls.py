from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView,
    PublicTokenView,
    UserDetailView,
    RegisterUserView,
    ChangePasswordView,
    UpdateRegionView,
    ProfileImageUploadView,
    RemovePreferredStoreView,
    AddPreferredStoreView
)


urlpatterns = [
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('public-token/', PublicTokenView.as_view(), name='public_token'),
    path('me/', UserDetailView.as_view(), name='user_detail'),
    path("me/password/", ChangePasswordView.as_view(), name="change_password"),
    path("register/", RegisterUserView.as_view(), name="register"),
    path('update-region/', UpdateRegionView.as_view(), name='update-region'),
    path('profile-image-upload/', ProfileImageUploadView.as_view(), name='profile-image-upload'),
    path('remove-preferred-store/', RemovePreferredStoreView.as_view(), name='remove-preferred-store'),
    path("add-preferred-store/", AddPreferredStoreView.as_view(), name="add-preferred-store"),
    path("password_reset/", include("django_rest_passwordreset.urls", namespace="password_reset")),

]

