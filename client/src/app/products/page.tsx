'use client';

import { useEffect, useState, useCallback } from 'react';
import { productApi } from '@/lib/api';
import type { Product, ReviewsResponse } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import Toast from '@/components/Toast';

const categoryEmojis: Record<string, string> = {
    widgets: '⚙️',
    gadgets: '📱',
    electronics: '💻',
    accessories: '🎧',
};

const categoryGradients: Record<string, string> = {
    widgets: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(139, 92, 246, 0.12))',
    gadgets: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(37, 99, 235, 0.12))',
    electronics: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(22, 163, 74, 0.12))',
    accessories: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(234, 88, 12, 0.12))',
};

const CATEGORIES = ['widgets', 'gadgets', 'electronics', 'accessories'];

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [reviews, setReviews] = useState<Record<string, ReviewsResponse>>({});
    const { addItem, openCart } = useCart();
    const { isAuthenticated, token, userId, userName } = useAuth();

    // Search & Filter state
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [sortBy, setSortBy] = useState('');

    // Review modal state
    const [reviewModal, setReviewModal] = useState<string | null>(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    // Create Product modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creatingProduct, setCreatingProduct] = useState(false);
    const [newProduct, setNewProduct] = useState({
        name: '',
        description: '',
        category: 'electronics',
        price: '',
        stock: '',
        image_url: '',
    });

    // Delete state
    const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

    const fetchProducts = useCallback(() => {
        setLoading(true);
        const params: Record<string, any> = {};
        if (search) params.search = search;
        if (selectedCategory) params.category = selectedCategory;
        if (sortBy) params.sort = sortBy;

        productApi
            .list(params)
            .then((data) => {
                setProducts(data);
                const q: Record<string, number> = {};
                data.forEach((p) => (q[p.id] = 1));
                setQuantities(q);
                data.forEach((p) => {
                    productApi.getReviews(p.id).then((r) => {
                        setReviews((prev) => ({ ...prev, [p.id]: r }));
                    }).catch(() => { });
                });
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [search, selectedCategory, sortBy]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    useEffect(() => {
        productApi.categories().then((c) => setCategories(c.categories)).catch(() => { });
    }, []);

    const handleAddToCart = (product: Product) => {
        if (!isAuthenticated) {
            setToast({ type: 'error', message: 'Please sign in to add items to cart.' });
            return;
        }
        const qty = quantities[product.id] || 1;
        addItem(product, qty);
        setToast({ type: 'success', message: `Added ${qty}x ${product.name} to cart!` });
        openCart();
    };

    const setQty = (id: string, value: number) => {
        setQuantities((prev) => ({ ...prev, [id]: Math.max(1, value) }));
    };

    const handleSubmitReview = async () => {
        if (!reviewModal || !token || !userId) return;
        setSubmittingReview(true);
        try {
            await productApi.createReview(reviewModal, reviewRating, reviewComment, userId, userName || 'Anonymous');
            const r = await productApi.getReviews(reviewModal);
            setReviews((prev) => ({ ...prev, [reviewModal]: r }));
            setToast({ type: 'success', message: 'Review submitted!' });
            setReviewModal(null);
            setReviewComment('');
            setReviewRating(5);
        } catch (err: any) {
            setToast({ type: 'error', message: err.message || 'Failed to submit review' });
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleCreateProduct = async () => {
        if (!newProduct.name || !newProduct.category || !newProduct.price || !newProduct.stock) {
            setToast({ type: 'error', message: 'Please fill in all required fields.' });
            return;
        }
        setCreatingProduct(true);
        try {
            const created = await productApi.create(
                {
                    name: newProduct.name,
                    description: newProduct.description,
                    category: newProduct.category,
                    price: parseFloat(newProduct.price),
                    stock: parseInt(newProduct.stock),
                    image_url: newProduct.image_url,
                },
                token || ''
            );
            setToast({ type: 'success', message: `Product "${created.name}" created successfully!` });
            setShowCreateModal(false);
            setNewProduct({ name: '', description: '', category: 'electronics', price: '', stock: '', image_url: '' });
            fetchProducts();
            productApi.categories().then((c) => setCategories(c.categories)).catch(() => { });
        } catch (err: any) {
            setToast({ type: 'error', message: err.message || 'Failed to create product' });
        } finally {
            setCreatingProduct(false);
        }
    };

    const handleDeleteProduct = async (productId: string, productName: string) => {
        if (!confirm(`Delete "${productName}"? This cannot be undone.`)) return;
        setDeletingProductId(productId);
        try {
            await productApi.delete(productId, token || '');
            setToast({ type: 'success', message: `"${productName}" deleted successfully.` });
            setProducts((prev) => prev.filter((p) => p.id !== productId));
        } catch (err: any) {
            setToast({ type: 'error', message: err.message || 'Failed to delete product' });
        } finally {
            setDeletingProductId(null);
        }
    };

    const renderStars = (rating: number, interactive = false, onSet?: (r: number) => void) => {
        return (
            <div style={{ display: 'flex', gap: 2 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <span
                        key={star}
                        style={{
                            cursor: interactive ? 'pointer' : 'default',
                            fontSize: interactive ? '1.5rem' : '0.85rem',
                            color: star <= rating ? '#f59e0b' : 'var(--border)',
                            transition: 'color 0.15s',
                        }}
                        onClick={() => interactive && onSet?.(star)}
                    >
                        ★
                    </span>
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="loading-center">
                <div className="spinner" />
                <span>Loading products from catalog service...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <div className="page-header">
                    <h1 className="page-title">Products</h1>
                </div>
                <div className="alert alert-error">
                    ❌ Failed to load products: {error}
                </div>
                <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
                    Make sure the Product Catalog Service is running on port 3002.
                </p>
            </div>
        );
    }

    return (
        <div>
            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

            <div className="page-header fade-in">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <h1 className="page-title">Products</h1>
                        <p className="page-subtitle">
                            Browse our catalog • Powered by Python / FastAPI on port 3002
                        </p>
                    </div>
                    {isAuthenticated && (
                        <button
                            className="btn btn-primary"
                            onClick={() => setShowCreateModal(true)}
                            id="add-product-btn"
                            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                        >
                            <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>＋</span> Add Product
                        </button>
                    )}
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="card fade-in fade-in-delay-1" style={{ marginBottom: 24 }}>
                <div className="card-body" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                    <div style={{ flex: '1 1 200px', position: 'relative' }}>
                        <input
                            className="form-input"
                            type="text"
                            placeholder="🔍 Search products..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            id="product-search-input"
                            style={{ paddingLeft: 16 }}
                        />
                    </div>
                    <select
                        className="form-input"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        style={{ flex: '0 1 180px' }}
                        id="category-filter"
                    >
                        <option value="">All Categories</option>
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                        ))}
                    </select>
                    <select
                        className="form-input"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        style={{ flex: '0 1 180px' }}
                        id="sort-select"
                    >
                        <option value="">Default Sort</option>
                        <option value="price_asc">Price: Low → High</option>
                        <option value="price_desc">Price: High → Low</option>
                        <option value="name_asc">Name: A → Z</option>
                        <option value="name_desc">Name: Z → A</option>
                    </select>
                    {(search || selectedCategory || sortBy) && (
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => { setSearch(''); setSelectedCategory(''); setSortBy(''); }}
                            id="clear-filters-btn"
                        >
                            ✕ Clear
                        </button>
                    )}
                </div>
            </div>

            <div className="products-grid">
                {products.map((product, i) => {
                    const productReview = reviews[product.id];
                    return (
                        <div
                            className={`product-card fade-in fade-in-delay-${Math.min(i + 1, 4)}`}
                            key={product.id}
                        >
                            <div
                                className="product-card-image"
                                style={{
                                    background: categoryGradients[product.category] || categoryGradients.widgets,
                                }}
                            >
                                {categoryEmojis[product.category] || '📦'}
                                <span
                                    className={`product-card-badge ${product.stock > 20 ? 'in-stock' : 'low-stock'}`}
                                >
                                    {product.stock > 20 ? 'In Stock' : `Only ${product.stock} left`}
                                </span>
                            </div>

                            <div className="product-card-body">
                                <div className="product-card-category">{product.category}</div>
                                <div className="product-card-name">{product.name}</div>
                                {product.description && (
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 6, lineHeight: 1.4 }}>
                                        {product.description}
                                    </div>
                                )}
                                {productReview && productReview.count > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                        {renderStars(Math.round(productReview.average_rating))}
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            {productReview.average_rating} ({productReview.count})
                                        </span>
                                    </div>
                                )}
                                <div className="product-card-price">${product.price.toFixed(2)}</div>
                                <div className="product-card-stock">
                                    {product.stock} units available
                                </div>
                                <div className="product-card-footer">
                                    <div className="quantity-control">
                                        <button
                                            className="quantity-btn"
                                            onClick={() => setQty(product.id, (quantities[product.id] || 1) - 1)}
                                        >
                                            −
                                        </button>
                                        <div className="quantity-value">
                                            {quantities[product.id] || 1}
                                        </div>
                                        <button
                                            className="quantity-btn"
                                            onClick={() => setQty(product.id, (quantities[product.id] || 1) + 1)}
                                        >
                                            +
                                        </button>
                                    </div>
                                    <button
                                        className="btn btn-primary btn-sm"
                                        style={{ flex: 1 }}
                                        onClick={() => handleAddToCart(product)}
                                        id={`add-to-cart-${product.id}`}
                                    >
                                        Add to Cart
                                    </button>
                                </div>
                                {isAuthenticated && (
                                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            style={{ flex: 1, fontSize: '0.78rem' }}
                                            onClick={() => setReviewModal(product.id)}
                                            id={`review-btn-${product.id}`}
                                        >
                                            ⭐ Write a Review
                                        </button>
                                        <button
                                            className="btn btn-sm"
                                            style={{
                                                background: 'rgba(239,68,68,0.1)',
                                                color: '#f87171',
                                                border: '1px solid rgba(239,68,68,0.25)',
                                                fontSize: '0.78rem',
                                                opacity: deletingProductId === product.id ? 0.6 : 1,
                                            }}
                                            onClick={() => handleDeleteProduct(product.id, product.name)}
                                            disabled={deletingProductId === product.id}
                                            id={`delete-product-${product.id}`}
                                            title="Delete this product"
                                        >
                                            {deletingProductId === product.id ? '...' : '🗑️'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {products.length === 0 && !error && (
                <div className="card fade-in">
                    <div className="card-body">
                        <div className="empty-state">
                            <div className="empty-state-icon">📦</div>
                            <h3>No products found</h3>
                            <p>{search || selectedCategory ? 'Try adjusting your search or filters.' : 'The product catalog is empty.'}</p>
                            {isAuthenticated && !search && !selectedCategory && (
                                <button
                                    className="btn btn-primary"
                                    style={{ marginTop: 16 }}
                                    onClick={() => setShowCreateModal(true)}
                                >
                                    + Add First Product
                                </button>
                            )}
                            {(search || selectedCategory) && (
                                <button
                                    className="btn btn-primary"
                                    style={{ marginTop: 12 }}
                                    onClick={() => { setSearch(''); setSelectedCategory(''); setSortBy(''); }}
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ===== Create Product Modal ===== */}
            {showCreateModal && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
                }}>
                    <div className="card fade-in" style={{ maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="card-header" style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 1 }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>📦 Add New Product</h3>
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => !creatingProduct && setShowCreateModal(false)}
                                disabled={creatingProduct}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                            {/* Name */}
                            <div>
                                <label className="form-label" style={{ marginBottom: 6, display: 'block', fontWeight: 500 }}>
                                    Product Name <span style={{ color: 'var(--error)' }}>*</span>
                                </label>
                                <input
                                    className="form-input"
                                    type="text"
                                    placeholder="e.g. Wireless Mouse Pro"
                                    value={newProduct.name}
                                    onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))}
                                    disabled={creatingProduct}
                                    id="new-product-name"
                                    style={{ width: '100%' }}
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="form-label" style={{ marginBottom: 6, display: 'block', fontWeight: 500 }}>
                                    Description
                                </label>
                                <textarea
                                    className="form-input"
                                    rows={3}
                                    placeholder="Brief product description..."
                                    value={newProduct.description}
                                    onChange={(e) => setNewProduct((p) => ({ ...p, description: e.target.value }))}
                                    disabled={creatingProduct}
                                    id="new-product-description"
                                    style={{ width: '100%', resize: 'vertical' }}
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="form-label" style={{ marginBottom: 6, display: 'block', fontWeight: 500 }}>
                                    Category <span style={{ color: 'var(--error)' }}>*</span>
                                </label>
                                <select
                                    className="form-input"
                                    value={newProduct.category}
                                    onChange={(e) => setNewProduct((p) => ({ ...p, category: e.target.value }))}
                                    disabled={creatingProduct}
                                    id="new-product-category"
                                    style={{ width: '100%' }}
                                >
                                    {CATEGORIES.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {categoryEmojis[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Price & Stock side by side */}
                            <div style={{ display: 'flex', gap: 16 }}>
                                <div style={{ flex: 1 }}>
                                    <label className="form-label" style={{ marginBottom: 6, display: 'block', fontWeight: 500 }}>
                                        Price ($) <span style={{ color: 'var(--error)' }}>*</span>
                                    </label>
                                    <input
                                        className="form-input"
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        placeholder="29.99"
                                        value={newProduct.price}
                                        onChange={(e) => setNewProduct((p) => ({ ...p, price: e.target.value }))}
                                        disabled={creatingProduct}
                                        id="new-product-price"
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label className="form-label" style={{ marginBottom: 6, display: 'block', fontWeight: 500 }}>
                                        Stock (units) <span style={{ color: 'var(--error)' }}>*</span>
                                    </label>
                                    <input
                                        className="form-input"
                                        type="number"
                                        min="0"
                                        step="1"
                                        placeholder="100"
                                        value={newProduct.stock}
                                        onChange={(e) => setNewProduct((p) => ({ ...p, stock: e.target.value }))}
                                        disabled={creatingProduct}
                                        id="new-product-stock"
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>

                            {/* Image URL */}
                            <div>
                                <label className="form-label" style={{ marginBottom: 6, display: 'block', fontWeight: 500 }}>
                                    Image URL <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
                                </label>
                                <input
                                    className="form-input"
                                    type="url"
                                    placeholder="https://example.com/image.jpg"
                                    value={newProduct.image_url}
                                    onChange={(e) => setNewProduct((p) => ({ ...p, image_url: e.target.value }))}
                                    disabled={creatingProduct}
                                    id="new-product-image-url"
                                    style={{ width: '100%' }}
                                />
                            </div>

                            {/* Preview badge */}
                            {newProduct.name && (
                                <div style={{
                                    padding: '12px 16px',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: 10,
                                    border: '1px solid var(--border)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                }}>
                                    <span style={{ fontSize: '2rem' }}>{categoryEmojis[newProduct.category] || '📦'}</span>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{newProduct.name || 'Product Name'}</div>
                                        <div style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>
                                            {newProduct.price ? `$${parseFloat(newProduct.price).toFixed(2)}` : '$0.00'}
                                            <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.8rem', marginLeft: 8 }}>
                                                {newProduct.stock || 0} units
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                                <button
                                    className="btn btn-ghost"
                                    style={{ flex: 1 }}
                                    onClick={() => !creatingProduct && setShowCreateModal(false)}
                                    disabled={creatingProduct}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-primary"
                                    style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                    onClick={handleCreateProduct}
                                    disabled={creatingProduct}
                                    id="create-product-submit-btn"
                                >
                                    {creatingProduct ? (
                                        <>
                                            <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                                            Creating...
                                        </>
                                    ) : (
                                        '✓ Create Product'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Review Modal */}
            {reviewModal && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    background: 'rgba(0,0,0,0.6)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', padding: 20,
                }}>
                    <div className="card" style={{ maxWidth: 440, width: '100%', animation: 'fadeIn 0.2s' }}>
                        <div className="card-header">
                            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Write a Review</h3>
                            <button className="btn btn-ghost btn-sm" onClick={() => setReviewModal(null)}>✕</button>
                        </div>
                        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                                <label className="form-label">Rating</label>
                                {renderStars(reviewRating, true, setReviewRating)}
                            </div>
                            <div>
                                <label className="form-label">Comment</label>
                                <textarea
                                    className="form-input"
                                    rows={3}
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                    placeholder="Share your thoughts..."
                                    style={{ resize: 'vertical' }}
                                />
                            </div>
                            <button
                                className="btn btn-primary"
                                onClick={handleSubmitReview}
                                disabled={submittingReview}
                            >
                                {submittingReview ? 'Submitting...' : 'Submit Review'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
