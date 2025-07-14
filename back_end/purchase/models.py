from django.db import models, transaction
from django.db.models import Sum
from django.core.exceptions import ValidationError


class Product(models.Model):
    product_code = models.CharField(max_length=20, unique=True, blank=True)
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def stock(self):
        total_stock = self.warehouseitems.aggregate(total=Sum('quantity'))['total']
        return total_stock or 0

    def save(self, *args, **kwargs):
        if not self.product_code:
            last_product = Product.objects.all().order_by('id').last()
            new_id = (last_product.id + 1) if last_product else 1
            self.product_code = f'PROD-{new_id:03d}'
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class PurchaseOrder(models.Model):
    class OrderStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        RECEIVED = 'RECEIVED', 'Received'

    po_number = models.CharField(max_length=20, unique=True, blank=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    supplier = models.CharField(max_length=255, default='Default Supplier')
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    order_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=10, choices=OrderStatus.choices, default=OrderStatus.PENDING)

    def save(self, *args, **kwargs):
        if not self.po_number:
            last_order = PurchaseOrder.objects.all().order_by('id').last()
            new_id = (last_order.id + 1) if last_order else 1
            self.po_number = f'PO-{new_id:04d}'
        super().save(*args, **kwargs)


class WarehouseItem(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='warehouseitems')
    quantity = models.PositiveIntegerField()
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.SET_NULL, null=True, blank=True)
    added_at = models.DateTimeField(auto_now_add=True)


class SalesOrder(models.Model):
    so_number = models.CharField(max_length=20, unique=True, blank=True)
    customer_name = models.CharField(max_length=255)
    order_date = models.DateTimeField(auto_now_add=True)

    @property
    def total_amount(self):
        return self.items.aggregate(total=Sum(models.F('quantity') * models.F('price')))['total'] or 0

    def save(self, *args, **kwargs):
        if not self.so_number:
            last_order = SalesOrder.objects.all().order_by('id').last()
            new_id = (last_order.id + 1) if last_order else 1
            self.so_number = f'SO-{new_id:04d}'
        super().save(*args, **kwargs)


class SalesOrderItem(models.Model):
    sales_order = models.ForeignKey(SalesOrder, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)

    def clean(self):
        if self.quantity > self.product.stock:
            raise ValidationError(
                f"Not enough stock for {self.product.name}. Available: {self.product.stock}, Requested: {self.quantity}")

    def save(self, *args, **kwargs):
        if not self.pk:
            self.price = self.product.price
        self.clean()
        super().save(*args, **kwargs)
