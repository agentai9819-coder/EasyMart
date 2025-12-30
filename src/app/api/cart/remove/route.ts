import { NextResponse } from 'next/server';
import { callSalesforceApi } from '@/lib/salesforceAuth';
import { validateEnvironment } from '@/lib/envConfig';

export async function DELETE(request: Request) {
    try {
        // Validate environment variables are configured
        validateEnvironment();

        const { cartItemId } = await request.json();

        // Validate required fields
        if (!cartItemId || typeof cartItemId !== 'string' || cartItemId.trim() === '') {
            return NextResponse.json(
                { error: 'Cart Item ID is required' },
                { status: 400 }
            );
        }

        // Log the delete request
        // eslint-disable-next-line no-console
        console.log(`Removing cart item ${cartItemId}`);

        // Some Salesforce orgs treat DELETE bodies inconsistently.
        // Use PATCH with quantity=0 which the Apex `updateCartItem` treats as delete.
        const deleteResponse = await callSalesforceApi(
            '/services/apexrest/CartApi',
            'PATCH',
            { cartItemId, quantity: 0 }
        );

        if (!deleteResponse?.success) {
            return NextResponse.json(
                { 
                    success: false,
                    error: deleteResponse?.message || 'Failed to remove cart item',
                },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: deleteResponse.message,
            cartItemId: deleteResponse.cartItemId,
        });
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Cart remove error:', error);
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
        // Accept POST fallback which will be forwarded to Apex as PATCH (quantity=0)
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
            return NextResponse.json(
                { error: 'Cart Item ID is required' },
                { status: 400 }
            );
        }

        // Forward as PATCH with quantity 0 to invoke delete behavior in Apex
        const deleteResponse = await callSalesforceApi(
            '/services/apexrest/CartApi',
            'PATCH',
            { cartItemId, quantity: 0 }
        );

        if (!deleteResponse?.success) {
            return NextResponse.json(
                { 
                    success: false,
                    error: deleteResponse?.message || 'Failed to remove cart item',
                },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: deleteResponse.message,
            cartItemId: deleteResponse.cartItemId,
        });
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Cart remove (POST fallback) error:', error);
        return NextResponse.json(
            { 
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error',
            },
            { status: 500 }
        );
    }
}
