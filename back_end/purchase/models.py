from django.db import models

class Product(models.Model):
    """
    Represents a product available for purchase.
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
    Represents a customer's purchase order.
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
        return f"Order {self.id} by {self.customer_name}"

    def calculate_total_amount(self):
        """
        Calculates the total amount of the purchase order based on its items.
        """
        total = sum(item.quantity * item.price for item in self.items.all())
        self.total_amount = total
        self.save()


class PurchaseOrderItem(models.Model):
    """
    Represents a specific item within a purchase order.
    Stores the quantity and the price at the time of order.
    """
    purchase_order = models.ForeignKey(
        PurchaseOrder,
        related_name='items', # Allows accessing items via purchase_order.items.all()
        on_delete=models.CASCADE
    )
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    # Store price at the time of order to maintain historical accuracy
    price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.quantity} x {self.product.name} for Order {self.purchase_order.id}"

    def save(self, *args, **kwargs):
        # When an item is saved, capture the current product price
        if not self.pk: # Only set price if it's a new item (creation)
            self.price = self.product.price
        super().save(*args, **kwargs)
        # Recalculate total amount for the associated purchase order after saving/updating an item
        self.purchase_order.calculate_total_amount()

    def delete(self, *args, **kwargs):
        # Recalculate total amount for the associated purchase order after deleting an item
        purchase_order = self.purchase_order
        super().delete(*args, **kwargs)
        purchase_order.calculate_total_amount()
