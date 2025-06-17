from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Product, PurchaseOrder, PurchaseOrderItem
from .serializers import ProductSerializer, PurchaseOrderSerializer, PurchaseOrderItemSerializer

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by('name')
    serializer_class = ProductSerializer

class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.all().order_by('-order_date')
    serializer_class = PurchaseOrderSerializer

    # Optional: Add permissions, e.g., permissions.IsAuthenticated

    # You might want to override create and update for more complex logic
    # but the serializer's create/update methods handle nested items.

    # Example of a custom action: marking an order as shipped
    # from rest_framework.decorators import action
    # @action(detail=True, methods=['post'])
    # def mark_shipped(self, request, pk=None):
    #     purchase_order = self.get_object()
    #     if purchase_order.status == 'pending' or purchase_order.status == 'processing':
    #         purchase_order.status = 'shipped'
    #         purchase_order.save()
    #         return Response({'status': 'order marked as shipped'}, status=status.HTTP_200_OK)
    #     return Response({'status': 'order cannot be shipped from current status'}, status=status.HTTP_400_BAD_REQUEST)

class PurchaseOrderItemViewSet(viewsets.ModelViewSet):

    queryset = PurchaseOrderItem.objects.all()
    serializer_class = PurchaseOrderItemSerializer

    # Optional: Filter items by purchase_order_id if you want to access them like /api/purchase-orders/{pk}/items/
    # def get_queryset(self):
    #     queryset = super().get_queryset()
    #     purchase_order_pk = self.kwargs.get('purchase_order_pk') # Assuming you configure URLs like this
    #     if purchase_order_pk:
    #         queryset = queryset.filter(purchase_order__pk=purchase_order_pk)
    #     return queryset
