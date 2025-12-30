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

        // Build payload and log for debugging (temporary)
        const payload = {
            productId: productId.trim(),
            quantity,
            sku: sku || null,
        };

        // Log what we will send to Apex and the configured effective account id
        // (non-sensitive values only)
        // eslint-disable-next-line no-console
        console.log('Cart API payload ->', JSON.stringify(payload));
        // eslint-disable-next-line no-console
        console.log('Configured SALESFORCE_EFFECTIVE_ACCOUNT_ID ->', process.env.SALESFORCE_EFFECTIVE_ACCOUNT_ID);

        // Call Salesforce Apex REST API: CartApi
        const apexResponse = await callSalesforceApi(
            '/services/apexrest/CartApi',
            'POST',
            payload
        );

        // eslint-disable-next-line no-console
        console.log('[APEX RESPONSE] Full Apex response:', JSON.stringify(apexResponse, null, 2));
        // eslint-disable-next-line no-console
        console.log('[APEX RESPONSE] CartItemID from Apex:', apexResponse?.cartItemId);

        if (!apexResponse.success) {
            return NextResponse.json({ success: false, error: apexResponse.message || 'Failed to add item to cart' }, { status: 400, headers: CORS_HEADERS });
        }

        const responseData = {
            success: true,
            message: apexResponse.message,
            cartId: apexResponse.cartId,
            cartItemId: apexResponse.cartItemId,
            productName: apexResponse.productName,
            quantity: apexResponse.quantity,
        };

        // eslint-disable-next-line no-console
        console.log('[NEXTJS RESPONSE] Sending to frontend:', JSON.stringify(responseData, null, 2));

        return NextResponse.json(responseData, { headers: CORS_HEADERS });
    } catch (error) {
        console.error('Cart API error:', error);
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500, headers: CORS_HEADERS });
    }
}
