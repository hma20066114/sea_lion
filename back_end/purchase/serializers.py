from rest_framework import serializers
from .models import Product, PurchaseOrder, PurchaseOrderItem, SalesOrder, SalesOrderItem

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'

class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')

    class Meta:
        model = PurchaseOrderItem
        fields = ['id', 'product', 'product_name', 'quantity', 'price']
        read_only_fields = ['price']

class PurchaseOrderSerializer(serializers.ModelSerializer):
    items = PurchaseOrderItemSerializer(many=True, read_only=False)
    total_amount = serializers.ReadOnlyField()

    class Meta:
        model = PurchaseOrder
        fields = ['id', 'supplier_name', 'supplier_email', 'order_date', 'status', 'total_amount', 'items', 'created_at', 'updated_at']
        read_only_fields = ['order_date', 'created_at', 'updated_at']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        purchase_order = PurchaseOrder.objects.create(**validated_data)
        for item_data in items_data:
            PurchaseOrderItem.objects.create(purchase_order=purchase_order, **item_data)
        purchase_order.calculate_total_amount()
        return purchase_order

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', [])
        instance.supplier_name = validated_data.get('supplier_name', instance.supplier_name)
        instance.supplier_email = validated_data.get('supplier_email', instance.supplier_email)
        instance.status = validated_data.get('status', instance.status)
        instance.save()

        current_item_ids = [item.id for item in instance.items.all()]
        for item_data in items_data:
            item_id = item_data.get('id', None)
            if item_id in current_item_ids:
                item_instance = PurchaseOrderItem.objects.get(id=item_id, purchase_order=instance)
                item_instance.product = item_data.get('product', item_instance.product)
                item_instance.quantity = item_data.get('quantity', item_instance.quantity)
                item_instance.save()
            else:
                PurchaseOrderItem.objects.create(purchase_order=instance, **item_data)

        instance.calculate_total_amount()
        return instance

class SalesOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')

    class Meta:
        model = SalesOrderItem
        fields = ['id', 'product', 'product_name', 'quantity', 'price']
        read_only_fields = ['price']

class SalesOrderSerializer(serializers.ModelSerializer):
    items = SalesOrderItemSerializer(many=True, read_only=False)
    total_amount = serializers.ReadOnlyField()

    class Meta:
        model = SalesOrder
        fields = ['id', 'customer_name', 'customer_email', 'order_date', 'status', 'total_amount', 'items', 'created_at', 'updated_at']
        read_only_fields = ['order_date', 'created_at', 'updated_at']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        for item_data in items_data:
            product = Product.objects.get(id=item_data['product'].id)
            if product.stock < item_data['quantity']:
                raise serializers.ValidationError(f"Not enough stock for {product.name}. Available: {product.stock}")
        sales_order = SalesOrder.objects.create(**validated_data)
        for item_data in items_data:
            SalesOrderItem.objects.create(sales_order=sales_order, **item_data)
        sales_order.calculate_total_amount()
        return sales_order

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', [])
        instance.customer_name = validated_data.get('customer_name', instance.customer_name)
        instance.customer_email = validated_data.get('customer_email', instance.customer_email)
        instance.status = validated_data.get('status', instance.status)
        instance.save()

        current_item_ids = [item.id for item in instance.items.all()]
        for item_data in items_data:
            item_id = item_data.get('id', None)
            if item_id in current_item_ids:
                item_instance = SalesOrderItem.objects.get(id=item_id, sales_order=instance)
                item_instance.product = item_data.get('product', item_instance.product)
                item_instance.quantity = item_data.get('quantity', item_instance.quantity)
                item_instance.save()
            else:
                product = Product.objects.get(id=item_data['product'].id)
                if product.stock < item_data['quantity']:
                    raise serializers.ValidationError(f"Not enough stock for {product.name}. Available: {product.stock}")
                SalesOrderItem.objects.create(sales_order=instance, **item_data)

        instance.calculate_total_amount()
        return instance