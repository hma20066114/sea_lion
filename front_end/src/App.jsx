import React, { useState, useEffect } from 'react';

// Main App component
const App = () => {
  const [currentPage, setCurrentPage] = useState('products'); // State to manage current view

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 font-sans text-gray-800 p-4">
      <script src="https://cdn.tailwindcss.com"></script>
      {/* Tailwind CSS configuration */}
      <style>
        {`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        body {
          font-family: 'Inter', sans-serif;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .btn-primary {
            @apply bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out;
        }
        .btn-secondary {
            @apply bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out;
        }
        .input-field {
            @apply block w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500;
        }
        .card {
            @apply bg-white rounded-xl shadow-lg p-6 mb-4;
        }
        .table-header {
            @apply px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider;
        }
        .table-cell {
            @apply px-6 py-4 whitespace-nowrap text-sm text-gray-900;
        }
        `}
      </style>

      <nav className="bg-white p-4 rounded-xl shadow-lg mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-indigo-700">Purchase Order App</h1>
        <div>
          <button
            onClick={() => setCurrentPage('products')}
            className={`btn-secondary mr-2 ${currentPage === 'products' ? 'bg-indigo-100' : ''}`}
          >
            Products
          </button>
          <button
            onClick={() => setCurrentPage('createOrder')}
            className={`btn-secondary mr-2 ${currentPage === 'createOrder' ? 'bg-indigo-100' : ''}`}
          >
            Create Order
          </button>
          <button
            onClick={() => setCurrentPage('orders')}
            className={`btn-secondary ${currentPage === 'orders' ? 'bg-indigo-100' : ''}`}
          >
            All Orders
          </button>
        </div>
      </nav>

      <main className="container">
        {currentPage === 'products' && <ProductList />}
        {currentPage === 'createOrder' && <PurchaseOrderForm />}
        {currentPage === 'orders' && <PurchaseOrderList />}
      </main>
    </div>
  );
};

// Component to list and manage Products
const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '', stock: '' });

  const API_BASE_URL = 'http://127.0.0.1:8000/api'; // Make sure this matches your Django API URL

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/products/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      console.error("Error fetching products:", err);
      // More specific error message for failed fetch, suggesting common causes
      setError(`Failed to load products. Please ensure the backend is running at ${API_BASE_URL} and check for CORS issues. Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct({ ...newProduct, [name]: value });
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/products/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newProduct.name,
          description: newProduct.description,
          price: parseFloat(newProduct.price),
          stock: parseInt(newProduct.stock, 10),
        }),
      });
      if (!response.ok) {
        const errorData = await response.json(); // Try to get more specific error from DRF
        throw new Error(`HTTP error! status: ${response.status}. Details: ${JSON.stringify(errorData)}`);
      }
      setNewProduct({ name: '', description: '', price: '', stock: '' }); // Clear form
      fetchProducts(); // Refresh list
    } catch (err) {
      console.error("Error creating product:", err);
      setError(`Failed to create product. Error: ${err.message}. Please check backend logs.`);
    }
  };

  if (loading) return <div className="text-center text-lg mt-8">Loading products...</div>;
  if (error) return <div className="text-center text-red-600 text-lg mt-8">{error}</div>;

  return (
    <div className="card">
      <h2 className="text-2xl font-semibold text-indigo-600 mb-6">Available Products</h2>

      {/* Form to add new product */}
      <div className="mb-8 p-6 bg-blue-50 rounded-lg shadow-inner">
        <h3 className="text-xl font-medium text-indigo-500 mb-4">Add New Product</h3>
        <form onSubmit={handleCreateProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={newProduct.name}
              onChange={handleInputChange}
              className="input-field"
              placeholder="e.g., Laptop Pro X"
              required
            />
          </div>
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Price</label>
            <input
              type="number"
              id="price"
              name="price"
              value={newProduct.price}
              onChange={handleInputChange}
              className="input-field"
              step="0.01"
              min="0"
              placeholder="e.g., 1200.00"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              id="description"
              name="description"
              value={newProduct.description}
              onChange={handleInputChange}
              className="input-field"
              rows="3"
              placeholder="e.g., High-performance laptop with 16GB RAM..."
            ></textarea>
          </div>
          <div>
            <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
            <input
              type="number"
              id="stock"
              name="stock"
              value={newProduct.stock}
              onChange={handleInputChange}
              className="input-field"
              min="0"
              placeholder="e.g., 50"
              required
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" className="btn-primary">Add Product</button>
          </div>
        </form>
      </div>

      {products.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="table-header">Product Name</th>
                <th scope="col" className="table-header">Price</th>
                <th scope="col" className="table-header">Stock</th>
                <th scope="col" className="table-header">Description</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="table-cell font-medium">{product.name}</td>
                  <td className="table-cell">${product.price}</td>
                  <td className="table-cell">{product.stock}</td>
                  <td className="table-cell max-w-xs truncate">{product.description || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-gray-600 text-lg">No products found. Add a new product above!</p>
      )}
    </div>
  );
};

// Component to create a new Purchase Order
const PurchaseOrderForm = () => {
  const [products, setProducts] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [items, setItems] = useState([{ product: '', quantity: 1 }]);
  const [loading, setLoading] = useState(true);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', null
  const [errorMessage, setErrorMessage] = useState('');

  const API_BASE_URL = 'http://127.0.0.1:8000/api';

  useEffect(() => {
    fetchProductsForForm();
  }, []);

  const fetchProductsForForm = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/products/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      console.error("Error fetching products for form:", err);
      setErrorMessage(`Failed to load products for order form. Please ensure the backend is running at ${API_BASE_URL} and check for CORS issues. Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems([...items, { product: '', quantity: 1 }]);
  };

  const handleRemoveItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus(null);
    setErrorMessage('');

    // Filter out invalid items (e.g., product not selected)
    const validItems = items.filter(item => item.product && item.quantity > 0);
    if (validItems.length === 0) {
      setErrorMessage("Please add at least one valid product with a quantity.");
      return;
    }

    try {
      const orderData = {
        customer_name: customerName,
        customer_email: customerEmail,
        items: validItems.map(item => ({
          product: parseInt(item.product),
          quantity: parseInt(item.quantity)
        }))
      };

      const response = await fetch(`${API_BASE_URL}/purchase-orders/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error response:", errorData);
        let errorMsg = "Failed to create order. Please check your input.";
        if (errorData.items && errorData.items.length > 0) {
            errorMsg += " Item errors: " + JSON.stringify(errorData.items);
        } else if (errorData.non_field_errors) {
            errorMsg += " " + errorData.non_field_errors[0];
        } else if (typeof errorData === 'object') {
            errorMsg += " " + Object.values(errorData).flat().join(". ");
        }
        throw new Error(errorMsg);
      }

      setSubmitStatus('success');
      // Clear form
      setCustomerName('');
      setCustomerEmail('');
      setItems([{ product: '', quantity: 1 }]);
    } catch (err) {
      console.error("Error submitting order:", err);
      setErrorMessage(err.message || "An unexpected error occurred while creating the order.");
      setSubmitStatus('error');
    }
  };

  if (loading) return <div className="text-center text-lg mt-8">Loading products for order form...</div>;
  if (errorMessage && !submitStatus) return <div className="text-center text-red-600 text-lg mt-8">{errorMessage}</div>;

  return (
    <div className="card">
      <h2 className="text-2xl font-semibold text-indigo-600 mb-6">Create New Purchase Order</h2>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
          <input
            type="text"
            id="customerName"
            className="input-field"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
            placeholder="e.g., John Doe"
          />
        </div>
        <div className="mb-6">
          <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-1">Customer Email</label>
          <input
            type="email"
            id="customerEmail"
            className="input-field"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            required
            placeholder="e.g., john.doe@example.com"
          />
        </div>

        <h3 className="text-xl font-medium text-indigo-500 mb-4">Order Items</h3>
        {items.map((item, index) => (
          <div key={index} className="flex flex-col md:flex-row gap-4 mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50 items-end">
            <div className="flex-1 w-full">
              <label htmlFor={`product-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Product</label>
              <select
                id={`product-${index}`}
                className="input-field"
                value={item.product}
                onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                required
              >
                <option value="">Select a Product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} (${product.price})
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-auto">
              <label htmlFor={`quantity-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                id={`quantity-${index}`}
                className="input-field"
                value={item.quantity}
                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                min="1"
                required
              />
            </div>
            {items.length > 1 && (
              <div className="w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out w-full md:w-auto"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        ))}

        <button type="button" onClick={handleAddItem} className="btn-secondary mb-6">
          Add Another Item
        </button>

        <div className="flex justify-between items-center mt-6">
          <button type="submit" className="btn-primary">
            Submit Order
          </button>
          {submitStatus === 'success' && (
            <p className="text-green-600 font-semibold">Order created successfully!</p>
          )}
          {submitStatus === 'error' && (
            <p className="text-red-600 font-semibold">{errorMessage || "Error creating order."}</p>
          )}
        </div>
      </form>
    </div>
  );
};

// Component to list all Purchase Orders
const PurchaseOrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = 'http://127.0.0.1:8000/api';

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/purchase-orders/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(`Failed to load orders. Please ensure the backend is running at ${API_BASE_URL} and check for CORS issues. Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/purchase-orders/${orderId}/`, {
        method: 'PATCH', // Use PATCH for partial updates
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json(); // Try to get more specific error from DRF
        throw new Error(`HTTP error! status: ${response.status}. Details: ${JSON.stringify(errorData)}`);
      }
      fetchOrders(); // Refresh the list after update
    } catch (err) {
      console.error("Error updating order status:", err);
      setError(`Failed to update order status. Error: ${err.message}. Please check backend logs.`);
    }
  };

  if (loading) return <div className="text-center text-lg mt-8">Loading orders...</div>;
  if (error) return <div className="text-center text-red-600 text-lg mt-8">{error}</div>;

  return (
    <div className="card">
      <h2 className="text-2xl font-semibold text-indigo-600 mb-6">All Purchase Orders</h2>
      {orders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white border border-gray-200 rounded-xl shadow-md p-6">
              <h3 className="text-xl font-medium text-indigo-700 mb-2">Order #{order.id}</h3>
              <p className="text-gray-700 mb-1"><strong>Customer:</strong> {order.customer_name} ({order.customer_email})</p>
              <p className="text-gray-700 mb-1"><strong>Order Date:</strong> {new Date(order.order_date).toLocaleString()}</p>
              <p className="text-gray-700 mb-1">
                <strong>Status:</strong> <span className={`font-semibold ${
                  order.status === 'pending' ? 'text-yellow-600' :
                  order.status === 'processing' ? 'text-blue-600' :
                  order.status === 'shipped' ? 'text-purple-600' :
                  order.status === 'delivered' ? 'text-green-600' :
                  'text-red-600'
                }`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </p>
              <p className="text-gray-700 mb-4"><strong>Total Amount:</strong> ${parseFloat(order.total_amount).toFixed(2)}</p>

              <h4 className="text-lg font-medium text-indigo-600 mb-2">Items:</h4>
              {order.items && order.items.length > 0 ? (
                <ul className="list-disc pl-5 mb-4 text-gray-700">
                  {order.items.map((item) => (
                    <li key={item.id}>
                      {item.quantity} x {item.product_name || `Product ID: ${item.product}`} (${parseFloat(item.price).toFixed(2)} each)
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600 italic mb-4">No items for this order.</p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <select
                  className="input-field flex-grow md:flex-grow-0"
                  value={order.status}
                  onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-600 text-lg">No purchase orders found. Create one using the "Create Order" tab!</p>
      )}
    </div>
  );
};

export default App;





// import { createRoot } from "react-dom/client";
// import Pizza from "./Pizza";



// const App = () => {
//   return (
//     <div>
//       <h1>Sea Lion – Order Now</h1>
//       <Pizza
//           name="Pepperoni"
//           description="Mozzarella Cheese, Pepperoni"
//           image={"/public/pizzas/bbq_ckn.webp"}
//       />
//       <Pizza
//           name="The Hawaiian Pizza"
//           description="Sliced Ham, Pineapple, Mozzarella Cheese"
//           image={"/public/pizzas/hawaiian.webp"}
//       />
//       <Pizza name="The Big Meat Pizza" description="Bacon, Pepperoni, Italian Sausage, Chorizo Sausage" image={"/public/pizzas/calabrese.webp"}/>
//     </div>
//   );
// };
//
// const container = document.getElementById("root");
// const root = createRoot(container);
// root.render(<App />);
