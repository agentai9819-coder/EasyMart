import { NextResponse } from 'next/server';
import { callSalesforceApi } from '@/lib/salesforceAuth';
import { validateEnvironment } from '@/lib/envConfig';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export function OPTIONS() {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
    try {
        // Accept updates via POST to avoid PATCH preflight restrictions in some hosts
        validateEnvironment();

        const { cartItemId, quantity } = await request.json();

        if (!cartItemId || typeof cartItemId !== 'string' || cartItemId.trim() === '') {
            return NextResponse.json({ error: 'Cart Item ID is required' }, { status: 400, headers: CORS_HEADERS });
        }

        if (quantity === undefined || typeof quantity !== 'number' || quantity < 0) {
            return NextResponse.json({ error: 'Quantity must be a non-negative number' }, { status: 400, headers: CORS_HEADERS });
        }

        console.log(`Updating cart item ${cartItemId} to quantity ${quantity}`);

        const updateResponse = await callSalesforceApi('/services/apexrest/CartApi', 'POST', { cartItemId, quantity });

        if (!updateResponse?.success) {
            return NextResponse.json({ success: false, error: updateResponse?.message || 'Failed to update cart item' }, { status: 400, headers: CORS_HEADERS });
        }

        return NextResponse.json({ success: true, message: updateResponse.message, cartItemId: updateResponse.cartItemId, quantity: updateResponse.quantity }, { headers: CORS_HEADERS });
    } catch (error) {
        console.error('Cart update error:', error);
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500, headers: CORS_HEADERS });
    }
}

export async function PATCH(request: Request) {
    try {
        // Validate environment variables are configured
        validateEnvironment();

        const { cartItemId, quantity } = await request.json();

        // Validate required fields
        if (!cartItemId || typeof cartItemId !== 'string' || cartItemId.trim() === '') {
            return NextResponse.json({ error: 'Cart Item ID is required' }, { status: 400, headers: CORS_HEADERS });
        }

        if (quantity === undefined || typeof quantity !== 'number' || quantity < 0) {
            return NextResponse.json({ error: 'Quantity must be a non-negative number' }, { status: 400, headers: CORS_HEADERS });
        }

        console.log(`Updating cart item ${cartItemId} to quantity ${quantity}`);

        const updateResponse = await callSalesforceApi('/services/apexrest/CartApi', 'POST', { cartItemId, quantity });

        if (!updateResponse?.success) {
            return NextResponse.json({ success: false, error: updateResponse?.message || 'Failed to update cart item' }, { status: 400, headers: CORS_HEADERS });
        }

        return NextResponse.json({ success: true, message: updateResponse.message, cartItemId: updateResponse.cartItemId, quantity: updateResponse.quantity }, { headers: CORS_HEADERS });
    } catch (error) {
        console.error('Cart update error:', error);
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500, headers: CORS_HEADERS });
    }
}
