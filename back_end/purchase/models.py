from django.db import models
from django.core.exceptions import ValidationError

class Product(models.Model):
    """
    Represents a product available for purchase or sale.
    """
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class PurchaseOrder(models.Model):
    """
    Represents a purchase order to add stock to the warehouse.
    """
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('received', 'Received'),
        ('cancelled', 'Cancelled'),
    )

    supplier_name = models.CharField(max_length=255)
    supplier_email = models.EmailField()
    order_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Purchase Order {self.id} by {self.supplier_name}"

    def calculate_total_amount(self):
        """
        Calculates the total amount of the purchase order based on its items.
        """
        total = sum(item.quantity * item.price for item in self.items.all())
        self.total_amount = total
        self.save()

    def save(self, *args, **kwargs):
        """
        Increase stock when status changes to 'received'.
        """
        if self.pk:
            old_order = PurchaseOrder.objects.get(pk=self.pk)
            if old_order.status != 'received' and self.status == 'received':
                for item in self.items.all():
                    item.product.stock += item.quantity
                    item.product.save()
        super().save(*args, **kwargs)

class PurchaseOrderItem(models.Model):
    """
    Represents a specific item within a purchase order.
    """
    purchase_order = models.ForeignKey(
        PurchaseOrder,
        related_name='items',
        on_delete=models.CASCADE
    )
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.quantity} x {self.product.name} for Purchase Order {self.purchase_order.id}"

    def save(self, *args, **kwargs):
        if not self.pk:
            self.price = self.product.price
        super().save(*args, **kwargs)
        self.purchase_order.calculate_total_amount()

    def delete(self, *args, **kwargs):
        purchase_order = self.purchase_order
        super().delete(*args, **kwargs)
        purchase_order.calculate_total_amount()

class SalesOrder(models.Model):
    """
    Represents a customer's sales order to remove stock from the warehouse.
    """
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    )

    customer_name = models.CharField(max_length=255)
    customer_email = models.EmailField()
    order_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Sales Order {self.id} by {self.customer_name}"

    def calculate_total_amount(self):
        """
        Calculates the total amount of the sales order based on its items.
        """
        total = sum(item.quantity * item.price for item in self.items.all())
        self.total_amount = total
        self.save()

    def save(self, *args, **kwargs):
        """
        Decrease stock when status changes to 'shipped'.
        """
        if self.pk:
            old_order = SalesOrder.objects.get(pk=self.pk)
            if old_order.status != 'shipped' and self.status == 'shipped':
                for item in self.items.all():
                    if item.product.stock < item.quantity:
                        raise ValidationError(f"Not enough stock for {item.product.name}. Available: {item.product.stock}")
                    item.product.stock -= item.quantity
                    item.product.save()
        super().save(*args, **kwargs)

class SalesOrderItem(models.Model):
    """
    Represents a specific item within a sales order.
    """
    sales_order = models.ForeignKey(
        SalesOrder,
        related_name='items',
        on_delete=models.CASCADE
    )
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.quantity} x {self.product.name} for Sales Order {self.sales_order.id}"

    def save(self, *args, **kwargs):
        if not self.pk:
            self.price = self.product.price
        super().save(*args, **kwargs)
        self.sales_order.calculate_total_amount()

    def delete(self, *args, **kwargs):
        sales_order = self.sales_order
        super().delete(*args, **kwargs)
        sales_order.calculate_total_amount()