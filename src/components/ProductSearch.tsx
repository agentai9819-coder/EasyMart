import React, { useState, useEffect } from 'react';
import { Product } from '@/types';

interface ProductSearchProps {
    onProductSelect?: (product: Product) => void;
}

interface CartItem {
    quantity: number;
    cartItemId: string;
}

const ProductSearch: React.FC<ProductSearchProps> = ({ onProductSelect }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [cart, setCart] = useState<Record<string, CartItem>>({});
    const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

    const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);

        if (!value.trim()) {
            setResults([]);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`/api/products?search=${encodeURIComponent(value)}`);
            const data = await response.json();
            setResults(data.products || []);
        } catch (error) {
            console.error('Error searching products:', error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = async (product: Product, e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setUpdatingItemId(product.id);
        try {
            const response = await fetch('/api/cart/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: product.id, quantity: 1 }),
            });
            const data = await response.json();
            console.log('🔍 [CART ADD] Full API Response:', JSON.stringify(data, null, 2));
            console.log('🔍 [CART ADD] Response Success:', data.success);
            console.log('🔍 [CART ADD] CartID:', data.cartId);
            console.log('🔍 [CART ADD] CartItemID:', data.cartItemId);
            console.log('🔍 [CART ADD] ProductID:', product.id);
            
            if (data.success && data.cartItemId) {
                console.log(`📦 Storing in cart state - ProductID: ${product.id}, CartItemID: ${data.cartItemId}`);
                setCart((prev) => {
                    const updated = {
                        ...prev,
                        [product.id]: { quantity: 1, cartItemId: data.cartItemId },
                    };
                    console.log(`🛒 [STATE UPDATE] New cart state:`, JSON.stringify(updated, null, 2));
                    return updated;
                });
                console.log(`✅ Added ${product.name} to cart | CartID: ${data.cartId} | CartItemID: ${data.cartItemId}`);
            } else if (data.success && data.cartId) {
                // Apex returned cartId but not cartItemId — fetch cart lines and find the created item
                console.log('ℹ️ cartItemId missing — fetching cart lines to resolve item id');
                try {
                    const cartResp = await fetch('/api/cart/get');
                    const cartData = await cartResp.json();
                    if (cartData.success && cartData.cart && Array.isArray(cartData.cart.lines)) {
                        const found = cartData.cart.lines.find((l: any) => l.productId === product.id || l.productId === product.id);
                        const foundId = found?.cartItemId;
                        if (foundId) {
                            setCart((prev) => ({ ...prev, [product.id]: { quantity: found.quantity || 1, cartItemId: foundId } }));
                            console.log(`✅ Resolved cartItemId via GET cart: ${foundId}`);
                        } else {
                            console.warn('⚠️ Could not find created cart line for product after add');
                            // still show controls optimistically
                            setCart((prev) => ({ ...prev, [product.id]: { quantity: 1, cartItemId: '' } }));
                        }
                    }
                } catch (err) {
                    console.error('❌ Error fetching cart after add:', err);
                    setCart((prev) => ({ ...prev, [product.id]: { quantity: 1, cartItemId: '' } }));
                }
            } else {
                console.error(`❌ Failed: success=${data.success}, cartItemId=${data.cartItemId}`);
            }
        } catch (err) {
            console.error(`❌ Error adding ${product.name}:`, err);
        } finally {
            setUpdatingItemId(null);
        }
    };

    const handleIncreaseQuantity = async (product: Product, e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        const cartItem = cart[product.id];
        if (!cartItem) return;

        const newQuantity = cartItem.quantity + 1;
        setUpdatingItemId(product.id);
        try {
            const response = await fetch('/api/cart/update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cartItemId: cartItem.cartItemId, quantity: newQuantity }),
            });
            const data = await response.json();
            if (data.success) {
                setCart((prev) => ({
                    ...prev,
                    [product.id]: { ...prev[product.id], quantity: newQuantity },
                }));
                console.log(`📈 Updated ${product.name} quantity to ${newQuantity}`);
            } else {
                console.error(`❌ Failed to update quantity:`, data.error);
            }
        } catch (err) {
            console.error(`❌ Error updating quantity:`, err);
        } finally {
            setUpdatingItemId(null);
        }
    };

    const handleDecreaseQuantity = async (product: Product, e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        const cartItem = cart[product.id];
        if (!cartItem) return;

        const newQuantity = cartItem.quantity - 1;
        setUpdatingItemId(product.id);
        try {
            if (newQuantity === 0) {
                // Remove item if quantity reaches 0
                const response = await fetch('/api/cart/remove', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cartItemId: cartItem.cartItemId }),
                });
                const data = await response.json();
                if (data.success) {
                    setCart((prev) => {
                        const updated = { ...prev };
                        delete updated[product.id];
                        return updated;
                    });
                    console.log(`🗑️ Removed ${product.name} from cart`);
                } else {
                    console.error(`❌ Failed to remove item:`, data.error);
                }
            } else {
                // Update quantity
                const response = await fetch('/api/cart/update', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cartItemId: cartItem.cartItemId, quantity: newQuantity }),
                });
                const data = await response.json();
                if (data.success) {
                    setCart((prev) => ({
                        ...prev,
                        [product.id]: { ...prev[product.id], quantity: newQuantity },
                    }));
                    console.log(`📉 Updated ${product.name} quantity to ${newQuantity}`);
                } else {
                    console.error(`❌ Failed to update quantity:`, data.error);
                }
            }
        } catch (err) {
            console.error(`❌ Error updating quantity:`, err);
        } finally {
            setUpdatingItemId(null);
        }
    };

    const handleDeleteFromCart = async (product: Product, e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        const cartItem = cart[product.id];
        if (!cartItem) return;

        setUpdatingItemId(product.id);
        try {
            const response = await fetch('/api/cart/remove', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cartItemId: cartItem.cartItemId }),
            });
            const data = await response.json();
            if (data.success) {
                setCart((prev) => {
                    const updated = { ...prev };
                    delete updated[product.id];
                    return updated;
                });
                console.log(`🗑️ Removed ${product.name} from cart`);
            } else {
                console.error(`❌ Failed to remove item:`, data.error);
            }
        } catch (err) {
            console.error(`❌ Error removing item:`, err);
        } finally {
            setUpdatingItemId(null);
        }
    };

    const handleViewDetails = (product: Product, e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        onProductSelect?.(product);
    };

    return (
        <div style={styles.container}>
            <input
                type="text"
                value={query}
                onChange={handleSearch}
                placeholder="Search products..."
                style={styles.input}
            />
            {loading && <p style={styles.loading}>⏳ Loading products...</p>}
            {!loading && results.length === 0 && query.trim() && (
                <p style={styles.emptyState}>No products found. Try a different search.</p>
            )}
            <div style={styles.results}>
                {results.map((product) => (
                    <div
                        key={product.id}
                        style={styles.productCard}
                        onClick={() => onProductSelect?.(product)}
                    >
                        <div style={styles.imageContainer}>
                            {product.imageUrl ? (
                                <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    style={styles.productImage}
                                />
                            ) : (
                                <div style={styles.imagePlaceholder}>No Image</div>
                            )}
                        </div>
                        <h4 style={styles.productName}>{product.name}</h4>
                        <p style={styles.productPrice}>${product.price.toFixed(2)}</p>
                        <div style={styles.buttonRow}>
                            {!cart[product.id] ? (
                                <>
                                    <button
                                        style={styles.addToCartBtn}
                                        onClick={(e) => handleAddToCart(product, e)}
                                        disabled={updatingItemId === product.id}
                                    >
                                        🛒 Add to Cart
                                    </button>
                                    <button
                                        style={styles.viewDetailsBtn}
                                        onClick={(e) => handleViewDetails(product, e)}
                                    >
                                        👁️ View Details
                                    </button>
                                </>
                            ) : (
                                <div style={styles.quantityControl}>
                                    <button
                                        style={styles.quantityBtn}
                                        onClick={(e) => handleDecreaseQuantity(product, e)}
                                        disabled={updatingItemId === product.id}
                                    >
                                        −
                                    </button>
                                    <span style={styles.quantityDisplay}>{cart[product.id].quantity}</span>
                                    <button
                                        style={styles.quantityBtn}
                                        onClick={(e) => handleIncreaseQuantity(product, e)}
                                        disabled={updatingItemId === product.id}
                                    >
                                        +
                                    </button>
                                    <button
                                        style={styles.deleteBtn}
                                        onClick={(e) => handleDeleteFromCart(product, e)}
                                        disabled={updatingItemId === product.id}
                                        title="Remove from cart"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const styles = {
    container: {
        padding: '16px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    input: {
        width: '100%',
        padding: '12px 14px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        fontSize: '14px',
        boxSizing: 'border-box' as const,
        transition: 'border-color 0.2s, box-shadow 0.2s',
        outline: 'none',
    },
    loading: {
        textAlign: 'center' as const,
        color: '#666',
        fontSize: '14px',
        padding: '16px',
        margin: '12px 0',
        backgroundColor: '#f0f4f8',
        borderRadius: '8px',
        fontWeight: '500',
    },
    emptyState: {
        textAlign: 'center' as const,
        color: '#999',
        fontSize: '13px',
        padding: '16px',
        margin: '12px 0',
        backgroundColor: '#fafbfc',
        borderRadius: '8px',
    },
    results: {
        display: 'flex' as const,
        flexDirection: 'column' as const,
        gap: '12px',
        marginTop: '12px',
        maxHeight: '400px',
        overflowY: 'auto' as const,
    },
    productCard: {
        padding: '14px',
        border: '1px solid #ddd',
        borderRadius: '10px',
        cursor: 'pointer',
        backgroundColor: '#fff',
        transition: 'all 0.3s ease',
        boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
    },
    imageContainer: {
        width: '100%',
        height: '140px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        overflow: 'hidden',
        marginBottom: '10px',
        display: 'flex' as const,
        alignItems: 'center',
        justifyContent: 'center',
    },
    productImage: {
        width: '100%',
        height: '100%',
        objectFit: 'contain' as const,
        padding: '8px',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#e9ecef',
        display: 'flex' as const,
        alignItems: 'center',
        justifyContent: 'center',
        color: '#999',
        fontSize: '13px',
        fontStyle: 'italic',
    },
    productName: {
        margin: '0 0 8px 0',
        fontSize: '14px',
        fontWeight: '600',
        color: '#333',
        lineHeight: '1.4',
    },
    productPrice: {
        margin: '0 0 12px 0',
        color: '#0070f3',
        fontWeight: '700',
        fontSize: '16px',
    },
    buttonRow: {
        display: 'flex' as const,
        gap: '8px',
    },
    addToCartBtn: {
        flex: 1,
        padding: '8px 12px',
        backgroundColor: '#0070f3',
        color: '#fff',
        border: 'none',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
    },
    viewDetailsBtn: {
        flex: 1,
        padding: '8px 12px',
        backgroundColor: '#f0f0f0',
        color: '#333',
        border: '1px solid #ddd',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    quantityControl: {
        display: 'flex' as const,
        gap: '6px',
        alignItems: 'center' as const,
        padding: '6px',
        backgroundColor: '#f9f9f9',
        borderRadius: '6px',
        border: '1px solid #e0e0e0',
    },
    quantityBtn: {
        width: '32px',
        height: '32px',
        backgroundColor: '#0070f3',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer',
        display: 'flex' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        transition: 'background-color 0.2s',
    },
    quantityDisplay: {
        flex: 1,
        textAlign: 'center' as const,
        fontWeight: '600',
        fontSize: '14px',
        color: '#333',
    },
    deleteBtn: {
        width: '32px',
        height: '32px',
        backgroundColor: '#ff4757',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        fontSize: '14px',
        cursor: 'pointer',
        display: 'flex' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        transition: 'background-color 0.2s',
    },
};

export default ProductSearch;