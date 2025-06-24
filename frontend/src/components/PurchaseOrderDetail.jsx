import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function PurchaseOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedStatus, setEditedStatus] = useState('');
  const [products, setProducts] = useState([]); // To populate product dropdown for new items

  const STATUS_CHOICES = [
    'pending', 'processing', 'shipped', 'delivered', 'cancelled'
  ];

  useEffect(() => {
    const fetchOrderAndProducts = async () => {
      try {
        // Fetch order details
        const orderResponse = await fetch(`http://127.0.0.1:8000/api/purchase-orders/${id}/`);
        if (!orderResponse.ok) {
          throw new Error(`HTTP error! status: ${orderResponse.status}`);
        }
        const orderData = await orderResponse.json();
        setOrder(orderData);
        setEditedStatus(orderData.status);

        // Fetch all products (for adding new items)
        const productsResponse = await fetch('http://127.0.0.1:8000/api/products/');
        if (!productsResponse.ok) {
          throw new Error(`HTTP error! status: ${productsResponse.status}`);
        }
        const productsData = await productsResponse.json();
        setProducts(productsData);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderAndProducts();
  }, [id]);

  const handleUpdateOrder = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/purchase-orders/${id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...order, // Send existing data
          status: editedStatus, // Update only status
          items: order.items.map(({ id, product, quantity, price }) => ({
            id,
            product, // Send product ID
            quantity,
            price // Price is read-only on backend, but send it back for consistency
          }))
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, ${JSON.stringify(errorData)}`);
      }

      const updatedOrder = await response.json();
      setOrder(updatedOrder);
      setIsEditing(false);
      setError(null); // Clear any previous errors
      alert('Order updated successfully!');
    } catch (err) {
      setError(err.message);
      console.error("Error updating order:", err);
    }
  };

  const handleDeleteOrder = async () => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/purchase-orders/${id}/`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        alert('Order deleted successfully!');
        navigate('/orders'); // Redirect to order list
      } catch (err) {
        setError(err.message);
        console.error("Error deleting order:", err);
      }
    }
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...order.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setOrder({ ...order, items: updatedItems });
  };

  const handleAddItem = () => {
    setOrder(prevOrder => ({
      ...prevOrder,
      items: [
        ...prevOrder.items,
        { product: '', quantity: 1, id: null, price: 0 } // New item with placeholder product and quantity
      ]
    }));
  };

  const handleRemoveItem = async (itemIdToRemove, itemIndex) => {
    if (!order) return; // Should not happen if itemIndex is valid
    if (!window.confirm('Are you sure you want to remove this item?')) return;

    if (itemIdToRemove) {
      // Item already exists in backend, so DELETE it
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/purchase-order-items/${itemIdToRemove}/`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        alert('Item removed from order successfully!');
        // Filter out the deleted item
        const updatedItems = order.items.filter(item => item.id !== itemIdToRemove);
        setOrder({ ...order, items: updatedItems });
        // Recalculate total amount on the backend by fetching updated order
        const updatedOrderResponse = await fetch(`http://127.0.0.1:8000/api/purchase-orders/${id}/`);
        if (updatedOrderResponse.ok) {
          const updatedOrderData = await updatedOrderResponse.json();
          setOrder(updatedOrderData);
        }
      } catch (err) {
        setError(`Error removing item: ${err.message}`);
        console.error("Error removing item:", err);
      }
    } else {
      // Item is newly added in frontend, just remove it from state
      const updatedItems = order.items.filter((_, index) => index !== itemIndex);
      setOrder({ ...order, items: updatedItems });
    }
  };


  if (loading) {
    return <p>Loading order details...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>Error: {error}</p>;
  }

  if (!order) {
    return <p>Order not found.</p>;
  }

  return (
    <div style={styles.detailContainer}>
      <h2>Purchase Order #{order.id} Details</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <p><strong>Customer Name:</strong> {order.customer_name}</p>
      <p><strong>Customer Email:</strong> {order.customer_email}</p>
      <p><strong>Order Date:</strong> {new Date(order.order_date).toLocaleString()}</p>
      <p>
        <strong>Status:</strong>{' '}
        {isEditing ? (
          <select value={editedStatus} onChange={(e) => setEditedStatus(e.target.value)} style={styles.input}>
            {STATUS_CHOICES.map(status => (
              <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
            ))}
          </select>
        ) : (
          order.status
        )}
      </p>
      <p><strong>Total Amount:</strong> €{parseFloat(order.total_amount).toFixed(2)}</p>

      <h3>Order Items:</h3>
      {order.items.length === 0 ? (
        <p>No items in this order.</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Product</th>
              <th style={styles.th}>Quantity</th>
              <th style={styles.th}>Price at Order</th>
              {isEditing && <th style={styles.th}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr key={item.id || `new-${index}`}>
                <td style={styles.td}>
                  {isEditing ? (
                    <select
                      value={item.product}
                      onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                      style={styles.input}
                    >
                      <option value="">Select Product</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  ) : (
                    item.product_name
                  )}
                </td>
                <td style={styles.td}>
                  {isEditing ? (
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                      min="1"
                      style={{ ...styles.input, width: '80px' }}
                    />
                  ) : (
                    item.quantity
                  )}
                </td>
                <td style={styles.td}>€{parseFloat(item.price).toFixed(2)}</td>
                {isEditing && (
                  <td style={styles.td}>
                    <button
                      onClick={() => handleRemoveItem(item.id, index)}
                      style={{ ...styles.button, backgroundColor: '#dc3545', marginLeft: '5px' }}
                    >
                      Remove
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {isEditing && (
        <button onClick={handleAddItem} style={{ ...styles.button, backgroundColor: '#28a745', marginTop: '10px' }}>
          Add Item
        </button>
      )}

      <div style={styles.buttonGroup}>
        {isEditing ? (
          <>
            <button onClick={handleUpdateOrder} style={styles.button}>Save Changes</button>
            <button onClick={() => setIsEditing(false)} style={{ ...styles.button, backgroundColor: '#6c757d', marginLeft: '10px' }}>Cancel</button>
          </>
        ) : (
          <>
            <button onClick={() => setIsEditing(true)} style={styles.button}>Edit Order</button>
            <button onClick={handleDeleteOrder} style={{ ...styles.button, backgroundColor: '#dc3545', marginLeft: '10px' }}>Delete Order</button>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  detailContainer: {
    padding: '20px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#fff',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '20px',
  },
  th: {
    border: '1px solid #ddd',
    padding: '8px',
    backgroundColor: '#f2f2f2',
    textAlign: 'left',
  },
  td: {
    border: '1px solid #ddd',
    padding: '8px',
    textAlign: 'left',
  },
  buttonGroup: {
    marginTop: '20px',
    display: 'flex',
    justifyContent: 'flex-start',
  },
  button: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    backgroundColor: '#007bff',
    color: 'white',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'background-color 0.3s ease',
  },
  input: {
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    width: '100%',
    boxSizing: 'border-box',
  },
};

export default PurchaseOrderDetail;