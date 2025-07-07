import React, { useState, useEffect, useMemo, useCallback } from 'react';



const API_URL = 'http://127.0.0.1:8000/api/products/';

export default function App() {
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setProducts(data);
        } catch (err) {
            setError('Failed to fetch products. Please make sure your Django server is running and accessible.');
            console.error('Fetch Error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleFormSubmit = useCallback(async (productData) => {
        setLoading(true);
        const isEdit = Boolean(productData.id);
        const method = isEdit ? 'PUT' : 'POST';
        const url = isEdit ? `${API_URL}${productData.id}/` : API_URL;

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(productData),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            await response.json(); // Or handle the response data if needed
            fetchProducts(); // Re-fetch products to show the latest data
            closeModal();
        } catch (err) {
            setError(`Failed to ${isEdit ? 'update' : 'create'} product.`);
            console.error('Submit Error:', err);
        } finally {
            setLoading(false);
        }
    }, [fetchProducts]);

    const handleDelete = useCallback(async (id) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}${id}/`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                // Django REST Framework might return 204 No Content on success, which is ok
                if (response.status !== 204) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            }
            fetchProducts(); // Re-fetch after delete
            closeDeleteConfirm();
        } catch (err) {
            setError('Failed to delete product.');
            console.error('Delete Error:', err);
        } finally {
            setLoading(false);
        }
    }, [fetchProducts]);

    // Effect to fetch data on initial render
    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // Modal Controls
    const openModal = (product = null) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setSelectedProduct(null);
        setIsModalOpen(false);
    };

    const openDeleteConfirm = (product) => {
        setProductToDelete(product);
        setIsDeleteConfirmOpen(true);
    };
    const closeDeleteConfirm = () => {
        setProductToDelete(null);
        setIsDeleteConfirmOpen(false);
    };

    const filteredProducts = useMemo(() =>
        products.filter(product =>
            (product.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.description || '').toLowerCase().includes(searchTerm.toLowerCase())
        ), [products, searchTerm]);

    return (
        <div className="bg-gray-100 min-h-screen font-sans text-gray-800">
            <div className="container mx-auto p-4 md:p-8">
                <header className="flex flex-col sm:flex-row justify-between items-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-700 mb-4 sm:mb-0">Product Management</h1>
                    <button
                        onClick={() => openModal()}
                        className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg shadow-md hover:bg-blue-700 transition-all duration-300 ease-in-out"
                    >
                        Add New Product
                    </button>
                </header>

                {/* Search Bar */}
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {error && <ErrorMessage message={error} />}

                {loading && products.length === 0 ? (
                    <div className="text-center p-10">
                        <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mx-auto"></div>
                        <p className="mt-4">Loading Products...</p>
                    </div>
                ) : (
                    <ProductTable products={filteredProducts} onEdit={openModal} onDelete={openDeleteConfirm} />
                )}
            </div>

            {isModalOpen && (
                <ProductFormModal
                    product={selectedProduct}
                    onClose={closeModal}
                    onSubmit={handleFormSubmit}
                />
            )}

            {isDeleteConfirmOpen && (
                <DeleteConfirmationModal
                    product={productToDelete}
                    onClose={closeDeleteConfirm}
                    onConfirm={handleDelete}
                />
            )}
        </div>
    );
}

const ProductTable = ({ products, onEdit, onDelete }) => {
    if (products.length === 0) {
        return <div className="text-center text-gray-500 py-10">No products found.</div>;
    }

    return (
        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-normal max-w-sm">
                                <p className="text-sm text-gray-500 truncate">{product.description || '-'}</p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                <div className="text-sm text-gray-900">${parseFloat(product.price).toFixed(2)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                    {product.stock}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center space-x-4">
                                    <button name="Edit" onClick={() => onEdit(product)} aria-label="Edit Product">
                                        {/*<EditIcon />*/}
                                        Edit
                                    </button>
                                    <button name="Delete" onClick={() => onDelete(product)} aria-label="Delete Product">
                                        {/*<DeleteIcon />*/}
                                        Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const ProductFormModal = ({ product, onClose, onSubmit }) => {
    const isEditMode = Boolean(product);
    const [formData, setFormData] = useState({
        name: product?.name || '',
        description: product?.description || '',
        price: product?.price || '',
        stock: product?.stock || 0
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const dataToSubmit = isEditMode ? { ...formData, id: product.id } : formData;
        onSubmit(dataToSubmit);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-lg relative" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">&times;</button>
                <h2 className="text-2xl font-bold mb-6 text-gray-800">{isEditMode ? 'Edit Product' : 'Add a New Product'}</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                        <input
                            id="price"
                            name="price"
                            type="number"
                            step="0.01"
                            required
                            value={formData.price}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                        <input
                            id="stock"
                            name="stock"
                            type="number"
                            required
                            value={formData.stock}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            rows="4"
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        ></textarea>
                    </div>
                    <div className="flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">
                            Cancel
                        </button>
                        <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">
                            {isEditMode ? 'Update Product' : 'Save Product'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const DeleteConfirmationModal = ({ product, onClose, onConfirm }) => {
    if (!product) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md text-center">
                <h2 className="text-xl font-bold mb-4 text-gray-800">Confirm Deletion</h2>
                <p className="text-gray-600 mb-6">
                    Are you sure you want to delete the product "{product.name}"? This action cannot be undone.
                </p>
                <div className="flex justify-center space-x-4">
                    <button onClick={onClose} className="bg-gray-200 text-gray-700 font-bold py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors">
                        Cancel
                    </button>
                    <button onClick={() => onConfirm(product.id)} className="bg-red-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700 transition-colors">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

const ErrorMessage = ({ message }) => (
    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow" role="alert">
        <p className="font-bold">Error</p>
        <p>{message}</p>
    </div>
);