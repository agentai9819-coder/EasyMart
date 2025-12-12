'use client';

import React from 'react';
import ChatWidget from '@/components/ChatWidget';
import styles from './page.module.css';

export default function Home() {
    return (
        <main className={styles.main}>
            <div className={styles.content}>
                <h1>Product Search Chat Widget</h1>
                <p>
                    This is a demo of the chat widget. Use the floating chat button in the bottom right to start searching for products.
                </p>
                <section>
                    <h2>Features:</h2>
                    <ul>
                        <li>Real-time product search</li>
                        <li>AI-powered chat responses</li>
                        <li>Easy Salesforce integration</li>
                        <li>Responsive design</li>
                    </ul>
                </section>
                <section>
                    <h2>Integration:</h2>
                    <p>To embed on Salesforce, add this script to your page:</p>
                    <code className={styles.code}>
                        {'<script src="https://your-domain.com/chat-widget.js"></script>'}
                    </code>
                </section>
            </div>
            <div style={{ margin: 0, padding: 0, background: 'transparent' }}>
                <ChatWidget />
            </div>
        </main>
    );
}