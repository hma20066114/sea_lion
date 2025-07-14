from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User
from .models import Product, WarehouseItem, PurchaseOrder


class ProductModelUnitTests(TestCase):

    def setUp(self):
        self.product = Product.objects.create(name="Test Laptop", price=1200.00)

    def test_stock_calculation(self):
        """
        Test that the product's stock property is calculated correctly.
        """
        self.assertEqual(self.product.stock, 0)

        # Add an item to the warehouse for this product
        WarehouseItem.objects.create(product=self.product, quantity=50)

        # Refresh the product instance from the database to get the updated stock
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 50)


class AuthIntegrationTests(APITestCase):
    """
    Integration tests for the user registration and login API endpoints.
    """

    def test_register_user(self):
        """
        Ensure we can create a new user.
        """
        url = '/api/user/register/'
        data = {'username': 'testuser', 'password': 'testpassword123'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(User.objects.get().username, 'testuser')

    def test_login_user(self):
        """
        Ensure a registered user can log in and get an access token.
        """
        # First, create a user
        User.objects.create_user(username='testuser', password='testpassword123')

        url = '/api/token/'
        data = {'username': 'testuser', 'password': 'testpassword123'}
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue('access' in response.data)
        self.assertTrue('refresh' in response.data)


class ProductAPIIntegrationTests(APITestCase):
    """
    Integration tests for the protected Product API endpoint.
    """

    def setUp(self):
        # Create a user and authenticate the client
        self.user = User.objects.create_user(username='testuser', password='testpassword123')
        self.client.force_authenticate(user=self.user)

    def test_get_products_authenticated(self):
        """
        Ensure an authenticated user can access the product list.
        """
        Product.objects.create(name="Test Product", price=100.00)
        url = '/api/products/'
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_get_products_unauthenticated(self):
        """
        Ensure an unauthenticated user cannot access the product list.
        """
        self.client.force_authenticate(user=None)  # Log out the user
        url = '/api/products/'
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_product(self):
        """
        Ensure an authenticated user can create a new product.
        """
        url = '/api/products/'
        data = {'name': 'New Gadget', 'price': '99.99'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Product.objects.count(), 1)
        self.assertEqual(Product.objects.get().name, 'New Gadget')