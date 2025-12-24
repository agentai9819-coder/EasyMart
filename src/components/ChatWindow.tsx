import React, { useRef, useEffect, useState } from 'react';
import { ChatMessage } from '@/types';

interface CartItem {
    quantity: number;
    cartItemId: string;
}

interface ChatWindowProps {
    messages: ChatMessage[];
    input: string;
    loading: boolean;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit: (e: React.FormEvent) => void;
    onClose: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
    messages,
    input,
    loading,
    onInputChange,
    onSubmit,
    onClose,
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [cart, setCart] = useState<Record<string, CartItem>>({});
    const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

    const handleAddToCart = async (product: any, e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setUpdatingItemId(product.id);
        try {
            const response = await fetch('/api/cart/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: product.id, quantity: 1 }),
            });
            const data = await response.json();
            console.log('🔍 [CHAT CART ADD] Response:', JSON.stringify(data, null, 2));
            if (data.success && data.cartItemId) {
                setCart((prev) => ({
                    ...prev,
                    [product.id]: { quantity: 1, cartItemId: data.cartItemId },
                }));
                console.log(`✅ Added ${product.name} to cart | CartID: ${data.cartId} | CartItemID: ${data.cartItemId}`);
            } else if (data.success && data.cartId) {
                // If cartItemId wasn't returned, fetch cart lines to resolve the new item's id
                console.log('ℹ️ cartItemId missing — fetching cart lines to resolve item id');
                try {
                    const cartResp = await fetch('/api/cart/get');
                    const cartData = await cartResp.json();
                    if (cartData.success && cartData.cart && Array.isArray(cartData.cart.lines)) {
                        const found = cartData.cart.lines.find((l: any) => l.productId === product.id);
                        const foundId = found?.cartItemId;
                        if (foundId) {
                            setCart((prev) => ({ ...prev, [product.id]: { quantity: found.quantity || 1, cartItemId: foundId } }));
                            console.log(`✅ Resolved cartItemId via GET cart: ${foundId}`);
                        } else {
                            console.warn('⚠️ Could not find created cart line for product after add');
                            setCart((prev) => ({ ...prev, [product.id]: { quantity: 1, cartItemId: '' } }));
                        }
                    }
                } catch (err) {
                    console.error('❌ Error fetching cart after add:', err);
                    setCart((prev) => ({ ...prev, [product.id]: { quantity: 1, cartItemId: '' } }));
                }
            } else {
                console.error(`❌ Failed to add ${product.name}:`, data.error);
            }
        } catch (err) {
            console.error(`❌ Error adding ${product.name}:`, err);
        } finally {
            setUpdatingItemId(null);
        }
    };

    const handleIncreaseQuantity = async (product: any, e: React.MouseEvent<HTMLButtonElement>) => {
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
            }
        } catch (err) {
            console.error(`❌ Error updating quantity:`, err);
        } finally {
            setUpdatingItemId(null);
        }
    };

    const handleDecreaseQuantity = async (product: any, e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        const cartItem = cart[product.id];
        if (!cartItem) return;
        const newQuantity = cartItem.quantity - 1;
        setUpdatingItemId(product.id);
        try {
            if (newQuantity === 0) {
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
                }
            } else {
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
                }
            }
        } catch (err) {
            console.error(`❌ Error updating quantity:`, err);
        } finally {
            setUpdatingItemId(null);
        }
    };

    const handleDeleteFromCart = async (product: any, e: React.MouseEvent<HTMLButtonElement>) => {
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
            }
        } catch (err) {
            console.error(`❌ Error removing item:`, err);
        } finally {
            setUpdatingItemId(null);
        }
    };

    // Build an SEO-friendly slug from product name (simple safe implementation)
    const slugify = (text: string) =>
        text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

    // Open the Salesforce PDP for the product.
    // PDP URL pattern: https://{siteDomain}/{storePath}/product/{seoSlug}/{productId}
    // We use window.location.origin as the current site base URL and default store path '/FantasticEcomm'.
    const handleViewDetails = (product: any, e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        try {
            console.log('handleViewDetails called');
            console.log('Product ID:', product.id);
            console.log('Product Name:', product.name);
            const siteOrigin = typeof window !== 'undefined' ? window.location.origin : '';
            const storePath = '/FantasticEcomm'; // adjust this if your store path changes
            const seoSlug = product.name ? slugify(product.name) : 'product';

            // PDP URL built here
            const pdpUrl = `${siteOrigin}${storePath}/product/${encodeURIComponent(seoSlug)}/${encodeURIComponent(product.id)}`;

            // LOG: show the built URL and chosen redirect behavior
            // This helps test which URL will be opened and whether the code path is executed
            // eslint-disable-next-line no-console
            console.log('[VIEW DETAILS] siteOrigin:', siteOrigin);
            // eslint-disable-next-line no-console
            console.log('[VIEW DETAILS] pdpUrl:', pdpUrl);
            // eslint-disable-next-line no-console
            console.log('[VIEW DETAILS] opening in new tab');

            // Redirect happens here. Using window.open to open in a new tab.
            //window.open(pdpUrl, '_blank');
            // To open in same tab, replace with: window.location.href = pdpUrl;
            window.location.href = pdpUrl;
        } catch (err) {
            console.error('Failed to open product details page:', err);
        }
    };

    return (
        <div className="chat-window" style={styles.container}>
            <div style={styles.header}>
                <h3 style={{ margin: 0 }}>Product Search Chat</h3>
                <button
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'white',
                        fontSize: '20px',
                        cursor: 'pointer',
                        padding: '0',
                    }}
                >
                    ✕
                </button>
            </div>

            <div style={styles.messagesContainer}>
                {messages.length === 0 ? (
                    <div style={styles.emptyState}>
                        <p>👋 Hello! How can I help you find a product?</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id}>
                            <div
                                style={{
                                    ...styles.message,
                                    ...(msg.sender === 'user' ? styles.userMessage : styles.botMessage),
                                }}
                            >
                                {msg.content}
                            </div>

                            {/* Render product cards when bot message includes structured products */}
                            {msg.products && msg.products.length > 0 && (
                                <div style={styles.productList}>
                                    {msg.products.map((p) => {
                                        const cartItem = cart[p.id];
                                        const isUpdating = updatingItemId === p.id;
                                        return (
                                            <div key={p.id} style={styles.productCardInline}>
                                                <div style={styles.productImageContainer}>
                                                    {p.imageUrl ? (
                                                        <img src={p.imageUrl} alt={p.name} style={styles.productThumb} />
                                                    ) : (
                                                        <div style={styles.productThumbPlaceholder}>No Image</div>
                                                    )}
                                                </div>
                                                <div style={styles.productInfo}>
                                                    <div style={styles.productName}>{p.name}</div>
                                                    <div style={styles.productPrice}>${p.price.toFixed(2)}</div>
                                                    <div style={styles.actionButtons}>
                                                        {cartItem ? (
                                                            <>
                                                                <button
                                                                    style={styles.quantityBtn}
                                                                    onClick={(e) => handleDecreaseQuantity(p, e)}
                                                                    disabled={isUpdating}
                                                                >
                                                                    −
                                                                </button>
                                                                <span style={styles.quantityDisplay}>{cartItem.quantity}</span>
                                                                <button
                                                                    style={styles.quantityBtn}
                                                                    onClick={(e) => handleIncreaseQuantity(p, e)}
                                                                    disabled={isUpdating}
                                                                >
                                                                    +
                                                                </button>
                                                                <button
                                                                    style={styles.deleteBtn}
                                                                    onClick={(e) => handleDeleteFromCart(p, e)}
                                                                    disabled={isUpdating}
                                                                >
                                                                    🗑️
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button
                                                                style={styles.addToCartBtn}
                                                                onClick={(e) => handleAddToCart(p, e)}
                                                                disabled={isUpdating}
                                                            >
                                                                {isUpdating ? 'Adding...' : '🛒 Add to Cart'}
                                                            </button>
                                                        )}
                                                        <button
                                                            style={styles.viewDetailsBtn}
                                                            onClick={(e) => {
                                                                console.log('View Details clicked');
                                                                console.log('Product:', p);
                                                                handleViewDetails(p, e);
                                                            }}
                                                        >
                                                            👁️ Details
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))
                )}
                {loading && (
                    <div style={{ ...styles.message, ...styles.botMessage }}>
                        <span style={styles.typing}>Typing...</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={onSubmit} style={styles.inputContainer}>
                <input
                    type="text"
                    value={input}
                    onChange={onInputChange}
                    placeholder="Search for products..."
                    disabled={loading}
                    style={styles.input}
                />
                <button type="submit" disabled={loading} style={styles.sendButton}>
                    Send
                </button>
            </form>
        </div>
    );
};

const styles = {
    container: {
        position: 'fixed' as const,
        bottom: '90px',
        right: '20px',
        width: '350px',
        height: '500px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 5px 40px rgba(0, 0, 0, 0.16)',
        display: 'flex' as const,
        flexDirection: 'column' as const,
        zIndex: 1000,
        overflow: 'hidden',
    },
    header: {
        backgroundColor: '#0070f3',
        color: 'white',
        padding: '16px',
        display: 'flex' as const,
        justifyContent: 'space-between' as const,
        alignItems: 'center' as const,
    },
    messagesContainer: {
        flex: 1,
        padding: '16px',
        overflowY: 'auto' as const,
        display: 'flex' as const,
        flexDirection: 'column' as const,
        gap: '8px',
    },
    message: {
        padding: '8px 12px',
        borderRadius: '6px',
        maxWidth: '80%',
        wordWrap: 'break-word' as const,
    },
    userMessage: {
        alignSelf: 'flex-end' as const,
        backgroundColor: '#0070f3',
        color: 'white',
    },
    botMessage: {
        alignSelf: 'flex-start' as const,
        backgroundColor: '#e9ecef',
        color: '#333',
    },
    emptyState: {
        display: 'flex' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        height: '100%',
        color: '#999',
        textAlign: 'center' as const,
    },
    typing: {
        fontStyle: 'italic' as const,
    },
    productList: {
        display: 'flex' as const,
        flexDirection: 'column' as const,
        gap: '8px',
        marginTop: '8px',
    },
    productCardInline: {
        display: 'flex' as const,
        gap: '8px',
        padding: '10px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: '#fff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
    },
    productImageContainer: {
        flexShrink: 0,
        width: '70px',
        height: '70px',
        backgroundColor: '#f5f5f5',
        borderRadius: '6px',
        overflow: 'hidden',
        display: 'flex' as const,
        alignItems: 'center',
        justifyContent: 'center',
    },
    productThumb: {
        width: '100%',
        height: '100%',
        objectFit: 'contain' as const,
        padding: '4px',
    },
    productThumbPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#e9ecef',
        display: 'flex' as const,
        alignItems: 'center',
        justifyContent: 'center',
        color: '#999',
        fontSize: '11px',
        textAlign: 'center' as const,
        padding: '4px',
    },
    productInfo: {
        display: 'flex' as const,
        flexDirection: 'column' as const,
        flex: 1,
        justifyContent: 'space-between' as const,
    },
    productName: {
        fontSize: '13px',
        fontWeight: 600,
        color: '#333',
        marginBottom: '2px',
    },
    productPrice: {
        color: '#0070f3',
        fontWeight: 'bold' as const,
        fontSize: '14px',
        marginBottom: '6px',
    },
    actionButtons: {
        display: 'flex' as const,
        gap: '4px',
    },
    addToCartBtn: {
        flex: 1,
        padding: '4px 6px',
        backgroundColor: '#0070f3',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
    },
    viewDetailsBtn: {
        flex: 1,
        padding: '4px 6px',
        backgroundColor: '#f0f0f0',
        color: '#333',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    quantityBtn: {
        flex: 0,
        padding: '4px 6px',
        backgroundColor: '#f0f0f0',
        color: '#333',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
    },
    quantityDisplay: {
        flex: 0,
        padding: '4px 4px',
        fontSize: '11px',
        fontWeight: '600',
        minWidth: '20px',
        textAlign: 'center' as const,
    },
    deleteBtn: {
        flex: 0,
        padding: '4px 6px',
        backgroundColor: '#ffebee',
        color: '#c41c3b',
        border: '1px solid #ffcdd2',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
    },
    inputContainer: {
        display: 'flex' as const,
        gap: '8px',
        padding: '12px',
        borderTop: '1px solid #e9ecef',
    },
    input: {
        flex: 1,
        padding: '8px 12px',
        border: '1px solid #e9ecef',
        borderRadius: '4px',
        fontSize: '14px',
    },
    sendButton: {
        padding: '8px 16px',
        backgroundColor: '#0070f3',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
    },
};

export default ChatWindow;