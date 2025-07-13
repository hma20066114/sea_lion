from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, PurchaseOrderViewSet, PurchaseOrderItemViewSet, SalesOrderViewSet, SalesOrderItemViewSet

router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'purchase-orders', PurchaseOrderViewSet)
router.register(r'purchase-order-items', PurchaseOrderItemViewSet)
router.register(r'sales-orders', SalesOrderViewSet)
router.register(r'sales-order-items', SalesOrderItemViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
]