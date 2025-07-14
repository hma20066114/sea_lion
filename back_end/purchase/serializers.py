from rest_framework import serializers
from .models import Product, PurchaseOrder, WarehouseItem, SalesOrder, SalesOrderItem
from django.db import transaction
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'password')
        extra_kwargs = {'password': {'write_only': True}}


class ProductSerializer(serializers.ModelSerializer):
    stock = serializers.IntegerField(read_only=True)
    image = serializers.ImageField(max_length=None, use_url=True, allow_null=True, required=False)

    class Meta:
        model = Product
        fields = ['id', 'product_code', 'name', 'description', 'price', 'stock', 'image']
        read_only_fields = ['product_code']


class PurchaseOrderProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'image', 'product_code']


class PurchaseOrderSerializer(serializers.ModelSerializer):
    product = PurchaseOrderProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all(), source='product', write_only=True)

    class Meta:
        model = PurchaseOrder
        fields = ['id', 'po_number', 'product', 'product_id', 'supplier', 'quantity', 'unit_price', 'order_date',
                  'status']
        read_only_fields = ['status', 'order_date', 'po_number']


class WarehouseItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = WarehouseItem
        fields = ['id', 'product', 'quantity', 'added_at']


class SalesOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.ImageField(source='product.image', read_only=True)

    class Meta:
        model = SalesOrderItem
        fields = ['id', 'product', 'product_name', 'product_image', 'quantity', 'price']
        read_only_fields = ['price', 'product_name', 'product_image']


class SalesOrderSerializer(serializers.ModelSerializer):
    items = SalesOrderItemSerializer(many=True)
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = SalesOrder
        fields = ['id', 'so_number', 'customer_name', 'order_date', 'total_amount', 'items']
        read_only_fields = ['so_number']

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        sales_order = SalesOrder.objects.create(**validated_data)

        for item_data in items_data:
            product = item_data['product']
            quantity_to_sell = item_data['quantity']

            if product.stock < quantity_to_sell:
                raise serializers.ValidationError(
                    f"Not enough stock for {product.name}. Available: {product.stock}, Requested: {quantity_to_sell}"
                )

            SalesOrderItem.objects.create(sales_order=sales_order, **item_data)

            try:
                warehouse_item = WarehouseItem.objects.get(product=product)
                warehouse_item.quantity -= quantity_to_sell
                warehouse_item.save()
            except WarehouseItem.DoesNotExist:
                raise serializers.ValidationError(f"Warehouse inconsistency for product {product.name}.")

        return sales_order




