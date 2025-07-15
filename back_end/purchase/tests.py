from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User
from .models import Product, WarehouseItem, PurchaseOrder


class ProductModelUnitTests(TestCase):

    def setUp(self):
        self.product = Product.objects.create(name="Test Laptop", price=1200.00)

    def test_stock_calculation(self):

        self.assertEqual(self.product.stock, 0)

        WarehouseItem.objects.create(product=self.product, quantity=50)

        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 50)


class AuthIntegrationTests(APITestCase):


    def test_register_user(self):

        url = '/api/user/register/'
        data = {'username': 'testuser', 'password': 'testpassword123'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(User.objects.get().username, 'testuser')

    def test_login_user(self):

        User.objects.create_user(username='testuser', password='testpassword123')

        url = '/api/token/'
        data = {'username': 'testuser', 'password': 'testpassword123'}
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue('access' in response.data)
        self.assertTrue('refresh' in response.data)


class ProductAPIIntegrationTests(APITestCase):


    def setUp(self):
        # Create a user and authenticate the client
        self.user = User.objects.create_user(username='testuser', password='testpassword123')
        self.client.force_authenticate(user=self.user)

    def test_get_products_authenticated(self):

        Product.objects.create(name="Test Product", price=100.00)
        url = '/api/products/'
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_get_products_unauthenticated(self):

        self.client.force_authenticate(user=None)  # Log out the user
        url = '/api/products/'
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_product(self):

        url = '/api/products/'
        data = {'name': 'New Gadget', 'price': '99.99'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Product.objects.count(), 1)
        self.assertEqual(Product.objects.get().name, 'New Gadget')