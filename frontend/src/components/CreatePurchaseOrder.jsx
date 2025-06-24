import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function CreatePurchaseOrder() {
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [items, setItems] = useState([{ product: '', quantity: 1 }]); // Default one item
  const [products, setProducts] = useState([]); // To populate product dropdown
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/products/');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

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
    setError(null);

    // Basic validation
    if (!customerName || !customerEmail || items.length === 0) {
      setError('Please fill in all customer details and add at least one item.');
      return;
    }
    if (items.some(item => !item.product || item.quantity < 1)) {
      setError('Please select a product and ensure quantity is at least 1 for all items.');
      return;
    }

    const orderData = {
      customer_name: customerName,
      customer_email: customerEmail,
      items: items.map(item => ({
        product: item.product,
        quantity: item.quantity,
        // Price is read-only on the backend and automatically set
        // So we don't need to send it for new items.
      })),
    };

    try {
      const response = await fetch('http://127.0.0.1:8000/api/purchase-orders/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.detail || JSON.stringify(errorData);
        throw new Error(`HTTP error! status: ${response.status}, ${errorMessage}`);
      }

      const newOrder = await response.json();
      alert(`Order created successfully! Order ID: ${newOrder.id}`);
      navigate(`/orders/${newOrder.id}`); // Redirect to the new order's detail page
    } catch (err) {
      setError(`Failed to create order: ${err.message}`);
      console.error('Error creating order:', err);
    }
  };

  if (loading) {
    return <p>Loading products for order creation...</p>;
  }

  if (error && products.length === 0) {
    return <p style={{ color: 'red' }}>Error loading products: {error}</p>;
  }

  return (
    <div style={styles.formContainer}>
      <h2>Create New Purchase Order</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div style={styles.formGroup}>
          <label htmlFor="customerName" style={styles.label}>Customer Name:</label>
          <input
            type="text"
            id="customerName"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label htmlFor="customerEmail" style={styles.label}>Customer Email:</label>
          <input
            type="email"
            id="customerEmail"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            required
            style={styles.input}
          />
        </div>

        <h3>Order Items</h3>
        {items.map((item, index) => (
          <div key={index} style={styles.itemGroup}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Product:</label>
              <select
                value={item.product}
                onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                required
                style={styles.input}
              >
                <option value="">Select a product</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} (€{parseFloat(product.price).toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Quantity:</label>
              <input
                type="number"
                value={item.quantity}
                onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                min="1"
                required
                style={{ ...styles.input, width: '80px' }}
              />
            </div>
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveItem(index)}
                style={{ ...styles.button, backgroundColor: '#dc3545', marginLeft: '10px' }}
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={handleAddItem} style={{ ...styles.button, backgroundColor: '#6c757d', marginTop: '10px' }}>
          Add Another Item
        </button>

        <button type="submit" style={{ ...styles.button, backgroundColor: '#007bff', marginTop: '20px' }}>
          Place Order
        </button>
      </form>
    </div>
  );
}

const styles = {
  formContainer: {
    padding: '20px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#fff',
  },
  formGroup: {
    marginBottom: '15px',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    boxSizing: 'border-box',
  },
  itemGroup: {
    border: '1px dashed #eee',
    padding: '15px',
    marginBottom: '15px',
    borderRadius: '5px',
    backgroundColor: '#f9f9f9',
    display: 'flex',
    alignItems: 'flex-end',
    gap: '15px',
    flexWrap: 'wrap',
  },
  button: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'background-color 0.3s ease',
  },
};

export default CreatePurchaseOrder;