import { NextResponse } from 'next/server';

const mockProducts = [
    { id: '1', name: 'Laptop Pro', description: 'High-performance laptop', price: 1299, imageUrl: '/placeholder.png', category: 'Electronics' },
    { id: '2', name: 'Wireless Mouse', description: 'Ergonomic wireless mouse', price: 29, imageUrl: '/placeholder.png', category: 'Accessories' },
    { id: '3', name: 'USB-C Cable', description: 'High-speed USB-C cable', price: 15, imageUrl: '/placeholder.png', category: 'Cables' },
];

export async function POST(request: Request) {
    try {
        const { message } = await request.json();

        // Simple product recommendation logic
        const lowerMessage = message.toLowerCase();
        let responseMessage = '';
        let suggestedProducts = [];

        if (lowerMessage.includes('laptop')) {
            responseMessage = 'I found some great laptops for you!';
            suggestedProducts = mockProducts.filter(p => p.category === 'Electronics');
        } else if (lowerMessage.includes('mouse') || lowerMessage.includes('accessories')) {
            responseMessage = 'Check out these accessories!';
            suggestedProducts = mockProducts.filter(p => p.category === 'Accessories');
        } else if (lowerMessage.includes('cable') || lowerMessage.includes('cord')) {
            responseMessage = 'Here are some cables we recommend!';
            suggestedProducts = mockProducts.filter(p => p.category === 'Cables');
        } else {
            responseMessage = `You're looking for: ${message}. Here are some products that might interest you!`;
            suggestedProducts = mockProducts;
        }

        return NextResponse.json({ 
            reply: responseMessage,
            products: suggestedProducts 
        });
    } catch (error) {
        return NextResponse.json(
            { reply: 'Sorry, I encountered an error. Please try again.' },
            { status: 500 }
        );
    }
}