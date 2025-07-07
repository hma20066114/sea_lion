from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, PurchaseOrderViewSet, PurchaseOrderItemViewSet

router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'purchase-orders', PurchaseOrderViewSet)
router.register(r'purchase-order-items', PurchaseOrderItemViewSet)

# The API URLs are now determined automatically by the router.
urlpatterns = [
    path('', include(router.urls)),
]
