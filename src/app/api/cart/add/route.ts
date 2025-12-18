import { NextResponse } from 'next/server';
import { callSalesforceApi } from '@/lib/salesforceAuth';
import { validateEnvironment } from '@/lib/envConfig';

export async function POST(request: Request) {
    try {
        // Validate environment variables are configured
        validateEnvironment();

        const { productId, quantity, sku } = await request.json();

        // Validate required fields
        if (!productId || typeof productId !== 'string' || productId.trim() === '') {
            return NextResponse.json(
                { error: 'Product ID is required' },
                { status: 400 }
            );
        }

        if (!quantity || typeof quantity !== 'number' || quantity <= 0) {
            return NextResponse.json(
                { error: 'Quantity must be a positive number' },
                { status: 400 }
            );
        }

        // Call Salesforce Apex REST API: CartApi
        const apexResponse = await callSalesforceApi(
            '/services/apexrest/CartApi',
            'POST',
            {
                productId: productId.trim(),
                quantity,
                sku: sku || null,
            }
        );

        if (!apexResponse.success) {
            return NextResponse.json(
                { 
                    success: false,
                    error: apexResponse.message || 'Failed to add item to cart',
                },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: apexResponse.message,
            cartId: apexResponse.cartId,
            productName: apexResponse.productName,
            quantity: apexResponse.quantity,
        });
    } catch (error) {
        console.error('Cart API error:', error);
        return NextResponse.json(
            { 
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error',
            },
            { status: 500 }
        );
    }
}
