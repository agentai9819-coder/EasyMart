import { NextResponse } from 'next/server';

const mockProducts = [
    { id: '1', name: 'Laptop Pro', description: 'High-performance laptop', price: 1299, imageUrl: '/placeholder.png', category: 'Electronics' },
    { id: '2', name: 'Wireless Mouse', description: 'Ergonomic wireless mouse', price: 29, imageUrl: '/placeholder.png', category: 'Accessories' },
    { id: '3', name: 'USB-C Cable', description: 'High-speed USB-C cable', price: 15, imageUrl: '/placeholder.png', category: 'Cables' },
];

export async function POST(request: Request) {
    try {
        const { message } = await request.json();
        // Try to use the /api/search backend to perform a real product search.
        // Build host: prefer Vercel runtime URL when available, fallback to localhost for dev.
        const host = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
        const searchUrl = `${host}/api/search`;

        try {
            // Forward the user's message as a search query
            const resp = await fetch(searchUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: message, pageSize: 6 }),
            });

            const data = await resp.json();
            // Debug: log whether products were returned
            // eslint-disable-next-line no-console
            console.log('/api/chat -> /api/search response status', resp.status, 'products:', Array.isArray(data.products) ? data.products.length : 0);

            const reply = data && data.success
                ? (data.products && data.products.length > 0 ? `I found ${data.products.length} product(s) for you.` : `No products matched: ${message}`)
                : `Search service unavailable. Showing fallback results for: ${message}`;

            const suggested = Array.isArray(data.products) ? data.products : mockProducts;

            return NextResponse.json({ reply, products: suggested });
        } catch (err) {
            // On any error calling the search endpoint, fall back to mock products
            // eslint-disable-next-line no-console
            console.error('Error calling internal search API:', err);
            const fallbackReply = `Unable to perform product search; showing sample results.`;
            return NextResponse.json({ reply: fallbackReply, products: mockProducts });
        }
    } catch (error) {
        return NextResponse.json(
            { reply: 'Sorry, I encountered an error. Please try again.' },
            { status: 500 }
        );
    }
}