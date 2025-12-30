import { NextResponse } from 'next/server';
import { callSalesforceApi } from '@/lib/salesforceAuth';
import { validateEnvironment } from '@/lib/envConfig';

export async function GET() {
  try {
    validateEnvironment();

    const apexResponse = await callSalesforceApi('/services/apexrest/CartApi', 'GET');

    console.log('[APEX GET CART] Full Apex response:', JSON.stringify(apexResponse, null, 2));

    if (!apexResponse || !apexResponse.success) {
      return NextResponse.json({ success: false, error: apexResponse?.message || 'Failed to fetch cart' }, { status: 400 });
    }

    return NextResponse.json({ success: true, cart: apexResponse }, { status: 200 });
  } catch (err) {
    console.error('Error fetching cart:', err);
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 });
  }
}
