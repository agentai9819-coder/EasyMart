import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
    title: 'Chat Widget',
    description: 'Product Search Chat Widget',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>
                {children}
            </body>
        </html>
    );
}