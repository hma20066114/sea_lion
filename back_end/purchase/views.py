from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Product, PurchaseOrder, PurchaseOrderItem
from .serializers import ProductSerializer, PurchaseOrderSerializer, PurchaseOrderItemSerializer

class ProductViewSet(viewsets.ModelViewSet):
    authentication_classes = []
    permission_classes = []

    queryset = Product.objects.all()
    serializer_class = ProductSerializer

class ProductCreateViewSet(viewsets.ModelViewSet):
    authentication_classes = []
    permission_classes = []
    queryset = Product.objects.all().order_by('name')
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

