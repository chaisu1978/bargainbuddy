from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework import status
from drf_spectacular.utils import extend_schema
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth.password_validation import validate_password
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import JSONParser

from .models import Region, User, Store
from .serializers import (
    UpdateRegionSerializer,
    UserSerializer,
    PublicTokenSerializer,
    ChangePasswordSerializer,
    RegisterUserSerializer,
    RemovePreferredStoreSerializer,
    AddPreferredStoreSerializer,
    ProfileImageUploadSerializer,
)
from rest_framework.parsers import MultiPartParser


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom view for obtaining token pair."""
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        return response


class PublicTokenView(APIView):
    """Generate a temporary JWT token for public users."""
    permission_classes = [AllowAny]  # Public access
    serializer_class = PublicTokenSerializer  # Add this line

    def post(self, request, *args, **kwargs):
        token = AccessToken()
        token["is_public"] = True  # Add custom claim for public access
        data = {"access": str(token)}
        serializer = self.serializer_class(data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserDetailView(RetrieveUpdateAPIView):
    """Retrieve user details."""
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

class RegisterUserView(APIView):
    """Register a new user."""
    permission_classes = [AllowAny]
    serializer_class = RegisterUserSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        if data["password"] != data["confirm_password"]:
            return Response(
                {"error": "Passwords do not match."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_password(data["password"])
            user = User.objects.create_user(
                email=data["email"],
                first_name=data["first_name"],
                last_name=data["last_name"],
                password=data["password"],
            )
            return Response(
                {"message": "User registered successfully."},
                status=status.HTTP_201_CREATED,
            )
        except ValidationError as e:
            return Response({"error": e.messages}, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    """Allow users to change their password."""
    permission_classes = [IsAuthenticated]
    serializer_class = ChangePasswordSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        data = request.data

        # Validate current password
        if not user.check_password(serializer.validated_data["current_password"]):
            return Response(
                {"error": "Current password is incorrect."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate and set new password
        new_password = serializer.validated_data["new_password"]
        confirm_password = serializer.validated_data["confirm_password"]

        if new_password != confirm_password:
            return Response(
                {"error": "New passwords do not match."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_password(new_password)
            user.set_password(new_password)
            user.save()
            return Response(
                {"message": "Password changed successfully."},
                status=status.HTTP_200_OK,
            )
        except ValidationError as e:
            return Response({"error": e.messages}, status=status.HTTP_400_BAD_REQUEST)


class UpdateRegionView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UpdateRegionSerializer

    def patch(self, request):
        serializer = UpdateRegionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        region_name = serializer.validated_data['region']
        try:
            region = Region.objects.get(region=region_name)
        except Region.DoesNotExist:
            # set to null
            region = None
            pass

        user = request.user
        user.preferred_region = region
        user.save()

        return Response({"message": "Region updated successfully."}, status=status.HTTP_200_OK)


class ProfileImageUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]
    serializer_class = ProfileImageUploadSerializer

    def post(self, request):
        user = request.user
        file = request.FILES.get('profile_picture')

        if not file:
            return Response({"error": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)

        # Save the file to the user's profile
        user.profile_picture = file
        user.save()

        return Response({"message": "Profile picture updated successfully."}, status=status.HTTP_200_OK)

class RemovePreferredStoreView(APIView):
    """Remove a preferred store for the current user."""
    permission_classes = [IsAuthenticated]
    serializer_class = RemovePreferredStoreSerializer
    parser_classes = [JSONParser]

    def delete(self, request):
        serializer = RemovePreferredStoreSerializer(data=request.data)
        if serializer.is_valid():
            try:
                store = Store.objects.get(id=serializer.validated_data["store_id"])
                request.user.preferred_stores.remove(store)
                return Response({"detail": "Store removed successfully."}, status=204)
            except Store.DoesNotExist:
                return Response({"detail": "Store not found."}, status=404)
            except Exception as e:
                return Response({"detail": str(e)}, status=400)
        return Response(serializer.errors, status=400)


class AddPreferredStoreView(APIView):
    """Add a preferred store for the current user."""
    permission_classes = [IsAuthenticated]
    serializer_class = AddPreferredStoreSerializer

    def post(self, request):
        serializer = AddPreferredStoreSerializer(data=request.data)
        if serializer.is_valid():
            store = Store.objects.get(id=serializer.validated_data["store_id"])
            request.user.preferred_stores.add(store)
            return Response({"detail": "Store added successfully."}, status=201)
        return Response(serializer.errors, status=400)
