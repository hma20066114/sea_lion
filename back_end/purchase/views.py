from rest_framework import viewsets
from .models import Product, PurchaseOrder, PurchaseOrderItem, SalesOrder, SalesOrderItem
from .serializers import ProductSerializer, PurchaseOrderSerializer, PurchaseOrderItemSerializer, SalesOrderSerializer, SalesOrderItemSerializer

class ProductViewSet(viewsets.ModelViewSet):
    authentication_classes = []
    permission_classes = []
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

class PurchaseOrderViewSet(viewsets.ModelViewSet):
    authentication_classes = []
    permission_classes = []
    queryset = PurchaseOrder.objects.all().order_by('-order_date')
    serializer_class = PurchaseOrderSerializer

class PurchaseOrderItemViewSet(viewsets.ModelViewSet):
    authentication_classes = []
    permission_classes = []
    queryset = PurchaseOrderItem.objects.all()
    serializer_class = PurchaseOrderItemSerializer

class SalesOrderViewSet(viewsets.ModelViewSet):
    authentication_classes = []
    permission_classes = []
    queryset = SalesOrder.objects.all().order_by('-order_date')
    serializer_class = SalesOrderSerializer

class SalesOrderItemViewSet(viewsets.ModelViewSet):
    authentication_classes = []
    permission_classes = []
    queryset = SalesOrderItem.objects.all()
    serializer_class = SalesOrderItemSerializer