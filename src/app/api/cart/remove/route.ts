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
        validateEnvironment();

        // Accept cartItemId either from JSON body or query param as fallback
        let cartItemId: string | undefined;
        try {
            const body = await request.json().catch(() => null);
            cartItemId = body?.cartItemId;
        } catch (e) {
            cartItemId = undefined;
        }

        if (!cartItemId) {
            const url = new URL(request.url);
            cartItemId = url.searchParams.get('cartItemId') || undefined;
        }

        if (!cartItemId || typeof cartItemId !== 'string' || cartItemId.trim() === '') {
            return NextResponse.json({ error: 'Cart Item ID is required' }, { status: 400, headers: CORS_HEADERS });
        }

        console.log(`Removing cart item ${cartItemId}`);

        const deleteResponse = await callSalesforceApi('/services/apexrest/CartApi', 'POST', { cartItemId, quantity: 0 });

        if (!deleteResponse?.success) {
            return NextResponse.json({ success: false, error: deleteResponse?.message || 'Failed to remove cart item' }, { status: 400, headers: CORS_HEADERS });
        }

        return NextResponse.json({ success: true, message: deleteResponse.message, cartItemId: deleteResponse.cartItemId }, { headers: CORS_HEADERS });
    } catch (error) {
        console.error('Cart remove error:', error);
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500, headers: CORS_HEADERS });
    }
}

export async function DELETE(request: Request) {
    try {
        validateEnvironment();

        let cartItemId: string | undefined;
        try {
            const body = await request.json().catch(() => null);
            cartItemId = body?.cartItemId;
        } catch (e) {
            cartItemId = undefined;
        }

        if (!cartItemId) {
            const url = new URL(request.url);
            cartItemId = url.searchParams.get('cartItemId') || undefined;
        }

        if (!cartItemId || typeof cartItemId !== 'string' || cartItemId.trim() === '') {
            return NextResponse.json({ error: 'Cart Item ID is required' }, { status: 400, headers: CORS_HEADERS });
        }

        console.log(`Removing cart item ${cartItemId}`);

        const deleteResponse = await callSalesforceApi('/services/apexrest/CartApi', 'POST', { cartItemId, quantity: 0 });

        if (!deleteResponse?.success) {
            return NextResponse.json({ success: false, error: deleteResponse?.message || 'Failed to remove cart item' }, { status: 400, headers: CORS_HEADERS });
        }

        return NextResponse.json({ success: true, message: deleteResponse.message, cartItemId: deleteResponse.cartItemId }, { headers: CORS_HEADERS });
    } catch (error) {
        console.error('Cart remove error:', error);
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500, headers: CORS_HEADERS });
    }
}
