import React, { useRef, useEffect, useState } from 'react';
import { ChatMessage } from '@/types';

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

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

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
                                    {msg.products.map((p) => (
                                        <div key={p.id} style={styles.productCardInline}>
                                            {p.imageUrl && (
                                                <img src={p.imageUrl} alt={p.name} style={styles.productThumb} />
                                            )}
                                            <div style={styles.productInfo}>
                                                <div style={styles.productName}>{p.name}</div>
                                                <div style={styles.productPrice}>${p.price}</div>
                                            </div>
                                        </div>
                                    ))}
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
        padding: '8px',
        border: '1px solid #e9ecef',
        borderRadius: '6px',
        alignItems: 'center' as const,
    },
    productThumb: {
        width: '64px',
        height: '64px',
        objectFit: 'cover' as const,
        borderRadius: '4px',
    },
    productInfo: {
        display: 'flex' as const,
        flexDirection: 'column' as const,
    },
    productName: {
        fontSize: '14px',
        fontWeight: 600,
    },
    productPrice: {
        color: '#0070f3',
        fontWeight: 'bold' as const,
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