import React, { useState, useEffect, useMemo, useCallback } from 'react';

// --- Configuration ---
const API_BASE_URL = 'http://localhost:8000/api';

// --- API Service ---
const apiService = {
    get: async (endpoint, params = {}) => {
        const url = new URL(`${API_BASE_URL}${endpoint}`);
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        });
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
    },
    post: async (endpoint, data, isFormData = false) => {
        const headers = { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` };
        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers,
            body: isFormData ? data : JSON.stringify(data)
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(parseDjangoError(errData));
        }
        try {
            return await response.json();
        } catch (e) {
            return {};
        }
    },
    patch: async (endpoint, data, isFormData = false) => {
        const headers = { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` };
        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PATCH',
            headers,
            body: isFormData ? data : JSON.stringify(data)
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(parseDjangoError(errData));
        }
        return response.json();
    },
    delete: async (endpoint) => {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        });
        if (response.status !== 204 && !response.ok) {
            throw new Error('Failed to delete item.');
        }
    }
};


// --- Helper Components ---
const ErrorMessage = ({ message }) => <div className="error-message"><p>Error</p><pre>{message}</pre></div>;
const SuccessMessage = ({ message }) => <div className="success-message">{message}</div>;
const PageHeader = ({ title, subtitle, children }) => (
    <header className="page-header">
        <div><h1>{title}</h1><p>{subtitle}</p></div>
        <div className="page-header-actions">{children}</div>
    </header>
);
const LoadingSpinner = ({ text }) => <div className="loading-spinner">{text}</div>;
const parseDjangoError = (errorData) => {
    if (!errorData) return "An unknown error occurred.";
    if (errorData.detail) return errorData.detail;
    if (Array.isArray(errorData)) return errorData.join(' ');
    if (errorData.non_field_errors) return errorData.non_field_errors.join(', ');
    try {
        return Object.entries(errorData).map(([field, errors]) =>
            `${field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${Array.isArray(errors) ? errors.join(', ') : errors}`
        ).join(' ');
    } catch (e) {
        return String(errorData);
    }
};

const SearchBar = ({ onSearch }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        onSearch(searchTerm);
    };

    return (
        <form onSubmit={handleSearch} className="search-bar">
            <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
            <button type="submit">Search</button>
        </form>
    );
};

// --- Authentication Components ---
function LoginPage({ onLogin, onSwitchToRegister }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await fetch(`${API_BASE_URL}/token/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            if (!response.ok) {
                 const errData = await response.json();
                 throw new Error(parseDjangoError(errData));
            }
            const data = await response.json();
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            onLogin();
        } catch (err) {
            setError(`Login Failed: ${err.message}`);
        }
    };

    return (
        <div className="auth-container">
            <form onSubmit={handleSubmit} className="auth-form">
                <h2>Login</h2>
                {error && <ErrorMessage message={error} />}
                <div className="form-group">
                    <label>Username</label>
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>Password</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-primary">Login</button>
                <div className="auth-switch">
                    <button type="button" onClick={onSwitchToRegister}>Need an account? Register</button>
                </div>
            </form>
        </div>
    );
}

function RegisterPage({ onSwitchToLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [password2, setPassword2] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (password !== password2) {
            setError("Passwords do not match.");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/user/register/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            if (!response.ok) {
                 const errData = await response.json();
                 throw new Error(parseDjangoError(errData));
            }
            setSuccess("Registration successful! You will be redirected to the login page.");
            setTimeout(() => onSwitchToLogin(true), 3000);
        } catch (err) {
            setError(`Registration failed: ${err.message}`);
        }
    };

    return (
        <div className="auth-container">
            <form onSubmit={handleSubmit} className="auth-form">
                <h2>Register</h2>
                {error && <ErrorMessage message={error} />}
                {success && <SuccessMessage message={success} />}
                <div className="form-group">
                    <label>Username</label>
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>Password</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                 <div className="form-group">
                    <label>Confirm Password</label>
                    <input type="password" value={password2} onChange={e => setPassword2(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-primary">Register</button>
                 <div className="auth-switch">
                    <button type="button" onClick={() => onSwitchToLogin(false)}>Already have an account? Login</button>
                </div>
            </form>
        </div>
    );
}

// --- Main Application Page Components ---

function DashboardPage({ setCurrentPage }) {
    return (
         <div className="container">
            <PageHeader title="Dashboard" subtitle="Welcome to Sea Lion Distribution System." />
            <div className="dashboard-grid">
                <div onClick={() => setCurrentPage('products')} className="dashboard-card">
                    <h3>Products</h3>
                    <p>Add, edit, and manage products.</p>
                </div>
                <div onClick={() => setCurrentPage('warehouse')} className="dashboard-card">
                    <h3>Warehouse</h3>
                    <p>View current inventory.</p>
                </div>
                <div onClick={() => setCurrentPage('purchases')} className="dashboard-card">
                    <h3>Purchase Orders</h3>
                    <p>Manage orders from suppliers.</p>
                </div>
                 <div onClick={() => setCurrentPage('sales')} className="dashboard-card">
                    <h3>Sales Orders</h3>
                    <p>Manage orders for customers.</p>
                </div>
            </div>
        </div>
    );
}

function ProductPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const fetchProducts = useCallback(async (searchTerm = '') => {
        setLoading(true);
        setError(null);
        try {
            const params = searchTerm ? { search: searchTerm } : {};
            const data = await apiService.get('/products/', params);
            setProducts(data);
        } catch (err) {
            setError(`Could not fetch products. Please ensure the Django server is running and accessible. Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleFormSubmit = async (productFormData) => {
        const isEdit = !!productFormData.get('id');
        const url = isEdit ? `/products/${productFormData.get('id')}/` : '/products/';
        const method = isEdit ? 'patch' : 'post';
        try {
            await apiService[method](url, productFormData, true);
            fetchProducts();
            setIsModalOpen(false);
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    const handleDelete = async (productId) => {
        if (!window.confirm("Are you sure you want to delete this product?")) return;
        try {
            await apiService.delete(`/products/${productId}/`);
            fetchProducts();
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    return (
        <div className="container">
            <PageHeader title="Products" subtitle="Manage all products in your system.">
                <SearchBar onSearch={fetchProducts} />
                <button onClick={() => { setSelectedProduct(null); setIsModalOpen(true); }} className="btn btn-primary">
                    Add New Product
                </button>
            </PageHeader>
            {error && <ErrorMessage message={error} />}
             <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Image</th>
                            <th>Product ID</th>
                            <th>Name</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th style={{textAlign: 'center'}}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && !error ? (
                            <tr><td colSpan="6"><LoadingSpinner text="Loading products..." /></td></tr>
                        ) : (
                            products.map(product => (
                                <tr key={product.id}>
                                    <td>
                                        {product.image ?
                                            <img src={product.image} alt={product.name} className="product-image" /> :
                                            <div className="product-image-placeholder">No Image</div>
                                        }
                                    </td>
                                    <td>{product.product_code}</td>
                                    <td>{product.name}</td>
                                    <td>${parseFloat(product.price).toFixed(2)}</td>
                                    <td>{product.stock}</td>
                                    <td>
                                        <div className="table-actions">
                                            <button onClick={() => { setSelectedProduct(product); setIsModalOpen(true); }} className="edit-btn">Edit</button>
                                            <button onClick={() => handleDelete(product.id)} className="delete-btn">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {isModalOpen && <ProductFormModal product={selectedProduct} onClose={() => setIsModalOpen(false)} onSubmit={handleFormSubmit} />}
        </div>
    );
}

const ProductFormModal = ({ product, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        name: product?.name || '',
        description: product?.description || '',
        price: product?.price || '',
    });
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(product?.image || null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const productFormData = new FormData();

        productFormData.append('name', formData.name);
        productFormData.append('description', formData.description);
        productFormData.append('price', formData.price);

        if (imageFile) {
            productFormData.append('image', imageFile);
        }

        if (product) {
            productFormData.append('id', product.id);
        }

        onSubmit(productFormData);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="modal-close-btn">&times;</button>
                <h2>{product ? 'Edit Product' : 'Add New Product'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Product Name</label>
                        <input id="name" name="name" type="text" required value={formData.name} onChange={handleChange}/>
                    </div>
                    <div className="form-group">
                        <label htmlFor="price">Selling Price</label>
                        <input id="price" name="price" type="number" step="0.01" required value={formData.price} onChange={handleChange}/>
                    </div>
                     <div className="form-group">
                        <label htmlFor="image">Product Image</label>
                        <input id="image" name="image" type="file" accept="image/*" onChange={handleFileChange} />
                        {previewUrl && <img src={previewUrl} alt="Preview" className="image-preview"/>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <textarea id="description" name="description" rows="3" value={formData.description} onChange={handleChange}></textarea>
                    </div>
                    <div className="form-actions">
                        <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
                        <button type="submit" className="btn btn-primary">{product ? 'Update' : 'Save'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


function WarehousePage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchItems = useCallback(async (searchTerm = '') => {
        setLoading(true);
        setError(null);
        try {
            const params = searchTerm ? { search: searchTerm } : {};
            const data = await apiService.get('/warehouse/', params);
            setItems(data);
        } catch (err) {
                 const detailedError = `Could not connect to the API. Error: ${err.message}`;
                setError(detailedError);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    return (
        <div className="container">
            <PageHeader title="Warehouse Inventory" subtitle="All items currently in stock.">
                <SearchBar onSearch={fetchItems} />
            </PageHeader>
            {error && <ErrorMessage message={error} />}
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Image</th>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>Date Added</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && !error ? (
                            <tr><td colSpan="4"><LoadingSpinner text="Loading inventory..." /></td></tr>
                        ) : items.length === 0 && !error ? (
                            <tr><td colSpan="4" style={{textAlign: 'center', padding: '2.5rem'}}>Warehouse is empty.</td></tr>
                        ) : (
                            items.map(item => (
                                <tr key={item.id}>
                                    <td>
                                        {item.product.image ?
                                            <img src={item.product.image} alt={item.product.name} className="product-image" /> :
                                            <div className="product-image-placeholder">No Image</div>
                                        }
                                    </td>
                                    <td>{item.product.name}</td>
                                    <td>{item.quantity}</td>
                                    <td>{new Date(item.added_at).toLocaleDateString()}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function PurchaseOrderPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchOrders = useCallback(async (searchTerm = '') => {
        setLoading(true);
        setError(null);
        try {
            const params = searchTerm ? { search: searchTerm } : {};
            const data = await apiService.get('/purchase-orders/', params);
            setOrders(data);
        } catch (err) {
            setError(`Could not fetch purchase orders. Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleFormSubmit = async (orderData) => {
        try {
            await apiService.post('/purchase-orders/', orderData);
            fetchOrders();
            setIsModalOpen(false);
        } catch (err) {
            alert(`Error creating purchase order: ${err.message}`);
        }
    };

    const handleReceiveOrder = async (orderId) => {
        if (!window.confirm("Mark this order as received? This will add its items to the warehouse.")) return;
        try {
            await apiService.post(`/purchase-orders/${orderId}/receive/`);
            fetchOrders();
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    return (
        <div className="container">
            <PageHeader title="Purchase Orders" subtitle="Orders placed with suppliers.">
                 <SearchBar onSearch={fetchOrders} />
                 <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
                    Add Purchase Order
                </button>
            </PageHeader>
             {error && <ErrorMessage message={error} />}
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>PO Number</th>
                            <th>Image</th>
                            <th>Product</th>
                            <th>Supplier</th>
                            <th>Quantity</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && !error ? (
                            <tr><td colSpan="7"><LoadingSpinner text="Loading purchase orders..." /></td></tr>
                        ) : orders.length === 0 && !error ? (
                             <tr><td colSpan="7" style={{textAlign: 'center', padding: '2.5rem'}}>No purchase orders found.</td></tr>
                        ) : (
                            orders.map(order => (
                                <tr key={order.id}>
                                    <td>{order.po_number}</td>
                                     <td>
                                        {order.product.image ?
                                            <img src={order.product.image} alt={order.product.name} className="product-image" /> :
                                            <div className="product-image-placeholder">No Image</div>
                                        }
                                    </td>
                                    <td>{order.product.name}</td>
                                    <td>{order.supplier}</td>
                                    <td>{order.quantity}</td>
                                    <td>
                                        <span className={`status-badge ${order.status === 'RECEIVED' ? 'status-received' : 'status-pending'}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td>
                                        {order.status === 'PENDING' && (
                                            <button onClick={() => handleReceiveOrder(order.id)} className="btn btn-success" style={{fontSize: '0.75rem', padding: '0.25rem 0.75rem'}}>
                                                Receive
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {isModalOpen && <PurchaseOrderFormModal onClose={() => setIsModalOpen(false)} onSubmit={handleFormSubmit} />}
        </div>
    );
}

const PurchaseOrderFormModal = ({ onClose, onSubmit }) => {
    const [products, setProducts] = useState([]);
    const [formData, setFormData] = useState({
        product: '',
        supplier: '',
        quantity: 1,
        unit_price: 0,
    });

    useEffect(() => {
        const fetchProductsForForm = async () => {
            try {
                const data = await apiService.get('/products/');
                setProducts(data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchProductsForForm();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ ...formData, product_id: formData.product });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="modal-close-btn">&times;</button>
                <h2>Create Purchase Order</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="product">Product</label>
                        <select id="product" name="product" required value={formData.product} onChange={handleChange}>
                            <option value="">Select a product</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="supplier">Supplier Name</label>
                        <input id="supplier" name="supplier" type="text" required value={formData.supplier} onChange={handleChange}/>
                    </div>
                    <div className="form-group">
                        <label htmlFor="quantity">Quantity</label>
                        <input id="quantity" name="quantity" type="number" min="1" required value={formData.quantity} onChange={handleChange}/>
                    </div>
                     <div className="form-group">
                        <label htmlFor="unit_price">Price per Unit</label>
                        <input id="unit_price" name="unit_price" type="number" step="0.01" required value={formData.unit_price} onChange={handleChange}/>
                    </div>
                    <div className="form-actions">
                        <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
                        <button type="submit" className="btn btn-primary">Create Order</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


function SalesOrderPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchOrders = useCallback(async (searchTerm = '') => {
        setLoading(true);
        setError(null);
        try {
            const params = searchTerm ? { search: searchTerm } : {};
            const data = await apiService.get('/sales-orders/', params);
            setOrders(data);
        } catch (err) {
            setError(`Could not fetch sales orders. Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleFormSubmit = async (orderData) => {
        try {
            await apiService.post('/sales-orders/', orderData);
            fetchOrders();
            setIsModalOpen(false);
        } catch (err) {
            alert(`Error creating sales order: ${err.message}`);
        }
    };

    return (
        <div className="container">
            <PageHeader title="Sales Orders" subtitle="Orders from customers.">
                 <SearchBar onSearch={fetchOrders} />
                 <button onClick={() => setIsModalOpen(true)} className="btn btn-success">
                    Create Sales Order
                </button>
            </PageHeader>
             {error && <ErrorMessage message={error} />}
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>SO Number</th>
                            <th>Customer</th>
                            <th>Items</th>
                            <th>Total Amount</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && !error ? (
                            <tr><td colSpan="5"><LoadingSpinner text="Loading sales orders..." /></td></tr>
                        ) : orders.length === 0 && !error ? (
                             <tr><td colSpan="5" style={{textAlign: 'center', padding: '2.5rem'}}>No sales orders found.</td></tr>
                        ) : (
                            orders.map(order => (
                                <tr key={order.id}>
                                    <td>{order.so_number}</td>
                                    <td>{order.customer_name}</td>
                                    <td>
                                        <ul className="sales-order-item-list">
                                            {order.items.map(item => (
                                                <li key={item.id}>
                                                    {item.product_image ?
                                                        <img src={item.product_image} alt={item.product_name} className="table-product-image-small" /> :
                                                        <div className="table-product-image-placeholder-small"></div>
                                                    }
                                                    <span>{item.quantity} x {item.product_name}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </td>
                                    <td>${parseFloat(order.total_amount).toFixed(2)}</td>
                                    <td>{new Date(order.order_date).toLocaleDateString()}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {isModalOpen && <SalesOrderFormModal onClose={() => setIsModalOpen(false)} onSubmit={handleFormSubmit} />}
        </div>
    );
}

const SalesOrderFormModal = ({ onClose, onSubmit }) => {
    const [warehouseStock, setWarehouseStock] = useState([]);
    const [customerName, setCustomerName] = useState('');
    const [items, setItems] = useState([{ product: '', quantity: 1 }]);

    useEffect(() => {
        const fetchWarehouseStock = async () => {
            try {
                const data = await apiService.get('/warehouse/');
                setWarehouseStock(data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchWarehouseStock();
    }, []);

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;

        if (field === 'product') {
            const selectedStock = warehouseStock.find(stockItem => stockItem.product.id == value);
            if (selectedStock && newItems[index].quantity > selectedStock.quantity) {
                newItems[index].quantity = selectedStock.quantity;
            }
        }
        if (field === 'quantity') {
             const selectedStock = warehouseStock.find(stockItem => stockItem.product.id == newItems[index].product);
             if (selectedStock && value > selectedStock.quantity) {
                 alert(`Cannot sell more than available stock (${selectedStock.quantity})`);
                 newItems[index].quantity = selectedStock.quantity;
             }
        }
        setItems(newItems);
    };

    const handleAddItem = () => {
        setItems([...items, { product: '', quantity: 1 }]);
    };

    const handleRemoveItem = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const orderData = {
            customer_name: customerName,
            items: items.filter(item => item.product && item.quantity > 0).map(item => ({product: item.product, quantity: item.quantity}))
        };
        onSubmit(orderData);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" style={{maxWidth: '48rem'}} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="modal-close-btn">&times;</button>
                <h2>Create Sales Order</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="customer_name">Customer Name</label>
                        <input id="customer_name" name="customer_name" type="text" required value={customerName} onChange={(e) => setCustomerName(e.target.value)}/>
                    </div>

                    <h3>Order Items</h3>
                    <div className="sales-order-items">
                        {items.map((item, index) => (
                            <div key={index} className="sales-order-item">
                                <div className="item-product">
                                    <label>Product</label>
                                    <select name="product" required value={item.product} onChange={(e) => handleItemChange(index, 'product', e.target.value)}>
                                        <option value="">Select a product</option>
                                        {warehouseStock.map(stockItem => (
                                            <option key={stockItem.product.id} value={stockItem.product.id}>
                                                {stockItem.product.name} (In Stock: {stockItem.quantity})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="item-quantity">
                                    <label>Quantity</label>
                                    <input name="quantity" type="number" min="1" required value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}/>
                                </div>
                                <button type="button" onClick={() => handleRemoveItem(index)} className="item-remove-btn">&times;</button>
                            </div>
                        ))}
                    </div>

                    <button type="button" onClick={handleAddItem} className="add-item-btn">+ Add another item</button>

                    <div className="form-actions">
                        <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
                        <button type="submit" className="btn btn-success">Create Sales Order</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --- Main App Component ---
export default function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('access_token'));
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [authView, setAuthView] = useState('login');
    const [showLoginMessage, setShowLoginMessage] = useState(false);

    const handleLogin = () => {
        setIsAuthenticated(true);
        setCurrentPage('dashboard');
    };

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setIsAuthenticated(false);
        setAuthView('login');
    };

    const handleSwitchToLogin = (fromRegister) => {
        setAuthView('login');
        if (fromRegister) {
            setShowLoginMessage(true);
            setTimeout(() => setShowLoginMessage(false), 5000);
        }
    };

    if (!isAuthenticated) {
        if (authView === 'login') {
            return <LoginPage onLogin={handleLogin} onSwitchToRegister={() => setAuthView('register')} />;
        }
        return <RegisterPage onSwitchToLogin={handleSwitchToLogin} />;
    }

    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard': return <DashboardPage setCurrentPage={setCurrentPage} />;
            case 'products': return <ProductPage />;
            case 'warehouse': return <WarehousePage />;
            case 'purchases': return <PurchaseOrderPage />;
            case 'sales': return <SalesOrderPage />;
            default: return <DashboardPage setCurrentPage={setCurrentPage} />;
        }
    };

    return (
        <div>
            <nav className="nav-bar">
                <div className="nav-container">
                    <h1 className="nav-title" onClick={() => setCurrentPage('dashboard')}>Sea Lion</h1>
                    <div className="nav-links">
                        <button onClick={() => setCurrentPage('dashboard')} className={currentPage === 'dashboard' ? 'active' : ''}>Dashboard</button>
                        <button onClick={() => setCurrentPage('products')} className={currentPage === 'products' ? 'active' : ''}>Products</button>
                        <button onClick={() => setCurrentPage('warehouse')} className={currentPage === 'warehouse' ? 'active' : ''}>Warehouse</button>
                        <button onClick={() => setCurrentPage('purchases')} className={currentPage === 'purchases' ? 'active' : ''}>Purchase Orders</button>
                        <button onClick={() => setCurrentPage('sales')} className={currentPage === 'sales' ? 'active' : ''}>Sales Orders</button>
                        <button onClick={handleLogout}>Logout</button>
                    </div>
                </div>
            </nav>
            <main>
                {renderPage()}
            </main>
        </div>
    );
}
