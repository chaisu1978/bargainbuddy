from django.urls import path, include
from rest_framework.routers import DefaultRouter
from submission import views

router = DefaultRouter()
router.register('submission', views.SubmissionViewSet, basename='submission')

app_name = 'submission'

urlpatterns = [
    path('', include(router.urls)),
]
