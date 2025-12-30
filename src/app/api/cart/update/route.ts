import { NextResponse } from 'next/server';
import { callSalesforceApi } from '@/lib/salesforceAuth';
import { validateEnvironment } from '@/lib/envConfig';

export async function PATCH(request: Request) {
    try {
        // Validate environment variables are configured
        validateEnvironment();

        const { cartItemId, quantity } = await request.json();

        // Validate required fields
        if (!cartItemId || typeof cartItemId !== 'string' || cartItemId.trim() === '') {
            return NextResponse.json(
                { error: 'Cart Item ID is required' },
                { status: 400 }
            );
        }

        if (quantity === undefined || typeof quantity !== 'number' || quantity < 0) {
            return NextResponse.json(
                { error: 'Quantity must be a non-negative number' },
                { status: 400 }
            );
        }

        // Log the update request
        // eslint-disable-next-line no-console
        console.log(`Updating cart item ${cartItemId} to quantity ${quantity}`);

        // Call Apex CartApi endpoint (same as add-to-cart, but using PATCH)
        const updateResponse = await callSalesforceApi(
            '/services/apexrest/CartApi',
            'PATCH',
            { cartItemId, quantity }
        );

        if (!updateResponse?.success) {
            return NextResponse.json(
                { 
                    success: false,
                    error: updateResponse?.message || 'Failed to update cart item',
                },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: updateResponse.message,
            cartItemId: updateResponse.cartItemId,
            quantity: updateResponse.quantity,
        });
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Cart update error:', error);
        return NextResponse.json(
            { 
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error',
            },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        // Accept POST as a fallback from clients that prefer POST over PATCH
        validateEnvironment();

        const { cartItemId, quantity } = await request.json();

        // Validate required fields
        if (!cartItemId || typeof cartItemId !== 'string' || cartItemId.trim() === '') {
            return NextResponse.json(
                { error: 'Cart Item ID is required' },
                { status: 400 }
            );
        }

        if (quantity === undefined || typeof quantity !== 'number' || quantity < 0) {
            return NextResponse.json(
                { error: 'Quantity must be a non-negative number' },
                { status: 400 }
            );
        }

        // Forward to Salesforce as PATCH so Apex receives the update semantics
        const updateResponse = await callSalesforceApi(
            '/services/apexrest/CartApi',
            'PATCH',
            { cartItemId, quantity }
        );

        if (!updateResponse?.success) {
            return NextResponse.json(
                { 
                    success: false,
                    error: updateResponse?.message || 'Failed to update cart item',
                },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: updateResponse.message,
            cartItemId: updateResponse.cartItemId,
            quantity: updateResponse.quantity,
        });
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Cart update (POST fallback) error:', error);
        return NextResponse.json(
            { 
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error',
            },
            { status: 500 }
        );
    }
}
