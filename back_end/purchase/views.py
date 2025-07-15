# your_app_name/views.py

from rest_framework import viewsets, status, filters, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction, models
from .models import Product, PurchaseOrder, WarehouseItem, SalesOrder
from .serializers import ProductSerializer, PurchaseOrderSerializer, WarehouseItemSerializer, SalesOrderSerializer, \
    UserSerializer
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import User


class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]


class ProductViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Product.objects.all().order_by('name')
    serializer_class = ProductSerializer
    parser_classes = (MultiPartParser, FormParser)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['name']
    search_fields = ['name', 'product_code', 'description']
    ordering_fields = ['name', 'price', 'stock']


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = PurchaseOrder.objects.select_related('product').all().order_by('-order_date')
    serializer_class = PurchaseOrderSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'product__name']
    ordering_fields = ['order_date', 'supplier']

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        if 'product' in data and 'product_id' not in data:
            data['product_id'] = data.pop('product')

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=['post'], url_path='receive')
    @transaction.atomic
    def receive_order(self, request, pk=None):
        purchase_order = self.get_object()

        if purchase_order.status == 'RECEIVED':
            return Response({'error': 'This order has already been received.'}, status=status.HTTP_400_BAD_REQUEST)

        purchase_order.status = PurchaseOrder.OrderStatus.RECEIVED
        purchase_order.save()

        warehouse_item, created = WarehouseItem.objects.get_or_create(
            product=purchase_order.product,
            defaults={'quantity': 0}
        )
        warehouse_item.quantity += purchase_order.quantity
        warehouse_item.purchase_order = purchase_order
        warehouse_item.save()

        return Response({'status': 'Order received and stock updated.'}, status=status.HTTP_200_OK)


class WarehouseItemViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = WarehouseItem.objects.select_related('product').filter(quantity__gt=0).order_by('-added_at')
    serializer_class = WarehouseItemSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['product__name', 'product__product_code']


class SalesOrderViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = SalesOrder.objects.prefetch_related('items__product').all().order_by('-order_date')
    serializer_class = SalesOrderSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['customer_name']
    ordering_fields = ['order_date', 'total_amount']



