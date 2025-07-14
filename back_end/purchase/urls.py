from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import ProductViewSet, PurchaseOrderViewSet, WarehouseItemViewSet, SalesOrderViewSet, CreateUserView

router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'purchase-orders', PurchaseOrderViewSet)
router.register(r'warehouse', WarehouseItemViewSet, basename='warehouse')
router.register(r'sales-orders', SalesOrderViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('user/register/', CreateUserView.as_view(), name='register'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]