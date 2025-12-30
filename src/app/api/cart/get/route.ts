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

export async function GET() {
  try {
    validateEnvironment();

    const apexResponse = await callSalesforceApi('/services/apexrest/CartApi', 'GET');

    console.log('[APEX GET CART] Full Apex response:', JSON.stringify(apexResponse, null, 2));

    if (!apexResponse || !apexResponse.success) {
      return NextResponse.json({ success: false, error: apexResponse?.message || 'Failed to fetch cart' }, { status: 400, headers: CORS_HEADERS });
    }

    return NextResponse.json({ success: true, cart: apexResponse }, { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    console.error('Error fetching cart:', err);
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Internal error' }, { status: 500, headers: CORS_HEADERS });
  }
}
