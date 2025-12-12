import React, { useState, useEffect } from 'react';
import { Product } from '@/types';

interface ProductSearchProps {
    onProductSelect?: (product: Product) => void;
}

const ProductSearch: React.FC<ProductSearchProps> = ({ onProductSelect }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);

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

    return (
        <div style={styles.container}>
            <input
                type="text"
                value={query}
                onChange={handleSearch}
                placeholder="Search products..."
                style={styles.input}
            />
            {loading && <p style={styles.loading}>Loading...</p>}
            <div style={styles.results}>
                {results.map((product) => (
                    <div
                        key={product.id}
                        style={styles.productCard}
                        onClick={() => onProductSelect?.(product)}
                    >
                        {product.imageUrl && (
                            <img
                                src={product.imageUrl}
                                alt={product.name}
                                style={styles.productImage}
                            />
                        )}
                        <h4 style={styles.productName}>{product.name}</h4>
                        <p style={styles.productPrice}>${product.price}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const styles = {
    container: {
        padding: '12px',
    },
    input: {
        width: '100%',
        padding: '8px',
        border: '1px solid #e9ecef',
        borderRadius: '4px',
        fontSize: '14px',
        boxSizing: 'border-box' as const,
    },
    loading: {
        textAlign: 'center' as const,
        color: '#999',
        margin: '8px 0',
    },
    results: {
        display: 'flex' as const,
        flexDirection: 'column' as const,
        gap: '8px',
        marginTop: '8px',
        maxHeight: '300px',
        overflowY: 'auto' as const,
    },
    productCard: {
        padding: '8px',
        border: '1px solid #e9ecef',
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
    },
    productImage: {
        width: '100%',
        height: '100px',
        objectFit: 'cover' as const,
        borderRadius: '4px',
        marginBottom: '4px',
    },
    productName: {
        margin: '4px 0',
        fontSize: '14px',
    },
    productPrice: {
        margin: '4px 0',
        color: '#0070f3',
        fontWeight: 'bold',
    },
};

export default ProductSearch;