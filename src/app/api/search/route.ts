import { NextResponse } from 'next/server';

/**
 * PRODUCT SEARCH API - Salesforce Commerce Storefront REST API Integration
 *
 * ===== ARCHITECTURE NOTES =====
 * 
 * WHY Commerce Storefront REST (NOT Apex):
 * - Product search in B2B Commerce should use Commerce Storefront REST APIs
 * - Storefront APIs handle pricing, visibility, and catalog filtering automatically
 * - Apex should ONLY be used for cart/checkout operations via ConnectApi
 * - This approach is future-proof and follows Salesforce LWR best practices
 *
 * SALESFORCE BEST PRACTICES:
 * - Use /services/data/{version}/commerce/webstores/{webStoreId}/search/products
 * - Handles Product2, PricebookEntry, ProductMedia lookups internally
 * - Respects buyer context, effective accounts, and price books automatically
 * - No nested queries or custom logic needed
 *
 * AUTHENTICATION:
 * - TODO: Implement JWT Bearer Flow (getAccessToken function below is stubbed)
 * - Will use SALESFORCE_CLIENT_ID, SALESFORCE_USERNAME, SALESFORCE_PRIVATE_KEY
 * - For now: use placeholder getAccessToken() stub
 * - Future: Replace with actual OAuth token exchange
 *
 * FUTURE IMPLEMENTATION:
 * - Wire getAccessToken() to real OAuth flow when ready
 * - No changes needed to this route when auth is ready
 */

interface CommerceProduct {
    id?: string;
    name?: string;
    // Commerce storefront product shape - prices and default image
    prices?: {
        unitPrice?: number;
        listPrice?: number;
        currencyIsoCode?: string;
        // Some responses nest prices differently; defensive access required
        [key: string]: any;
    };
    defaultImage?: {
        url?: string;
    } | null;
}

interface NormalizedProduct {
    id: string;
    name: string;
    price: number;
    currency: string;
    imageUrl: string | null;
}

/**
 * STUB: Get Salesforce Access Token
 * 
 * TODO: Replace this with real JWT Bearer Flow implementation
 * Current: Returns placeholder token
 * Future: Exchange JWT for access token via OAuth endpoint
 */
async function getAccessToken(): Promise<string> {
    // PLACEHOLDER - Will be implemented with JWT Bearer Flow
    // This needs: SALESFORCE_CLIENT_ID, SALESFORCE_USERNAME, SALESFORCE_PRIVATE_KEY
    // 
    // Steps to implement:
    // 1. Generate JWT token (RS256 signed)
    // 2. POST to SALESFORCE_LOGIN_URL/services/oauth2/token
    // 3. Return access_token from response
    //
    // For local testing, allow a temporary access-token stub supplied via env.
    // This keeps the file ready for later JWT implementation without refactor.
    const stub = process.env.SALESFORCE_ACCESS_TOKEN_STUB;
    if (stub && typeof stub === 'string' && stub.trim() !== '') {
        return stub.trim();
    }

    // If the stub is not provided, throw a clear error guiding the developer.
    throw new Error(
        'JWT Authentication not yet implemented. ' +
        'Set SALESFORCE_ACCESS_TOKEN_STUB in .env.local for local testing, ' +
        'or implement JWT Bearer Flow (see comments above)'
    );
}

/**
 * Normalize Salesforce Commerce API response to UI-friendly format
 */
function normalizeProduct(product: CommerceProduct): NormalizedProduct {
    // Defensive extraction following Commerce Storefront response shape
    const id = product?.id || '';
    const name = product?.name || '';

    // Prefer unitPrice, fallback to listPrice
    const unitPrice = product?.prices?.unitPrice;
    const listPrice = product?.prices?.listPrice;
    const currency = product?.prices?.currencyIsoCode || 'USD';

    const price = (typeof unitPrice === 'number')
        ? unitPrice
        : (typeof listPrice === 'number' ? listPrice : 0);

    // Image from defaultImage.url if present
    const imageUrl = product?.defaultImage?.url || null;

    return {
        id,
        name,
        price,
        currency,
        imageUrl,
    };
}

export async function POST(request: Request) {
    try {
        // ===== VALIDATE REQUEST =====
        const { query } = await request.json();

        if (!query || typeof query !== 'string' || query.trim() === '') {
            return NextResponse.json(
                { error: 'Search query is required and must be a non-empty string' },
                { status: 400 }
            );
        }

        // ===== VALIDATE ENVIRONMENT VARIABLES =====
        const instanceUrl = process.env.SALESFORCE_INSTANCE_URL;
        const apiVersion = process.env.SALESFORCE_API_VERSION || 'v60.0';
        const webStoreId = process.env.SALESFORCE_WEBSTORE_ID;
        const effectiveAccountId = process.env.SALESFORCE_EFFECTIVE_ACCOUNT_ID;

        if (!instanceUrl) {
            throw new Error('SALESFORCE_INSTANCE_URL not configured');
        }
        if (!webStoreId) {
            throw new Error('SALESFORCE_WEBSTORE_ID not configured');
        }
        if (!effectiveAccountId) {
            throw new Error('SALESFORCE_EFFECTIVE_ACCOUNT_ID not configured');
        }

        // ===== GET ACCESS TOKEN =====
        // TODO: When JWT is ready, this will automatically authenticate
        const accessToken = await getAccessToken();

        // ===== BUILD COMMERCE API ENDPOINT =====
        const searchUrl = new URL(
            `/services/data/${apiVersion}/commerce/webstores/${webStoreId}/search/products`,
            instanceUrl
        );

        // Add query parameters
        searchUrl.searchParams.append('q', query.trim());
        searchUrl.searchParams.append('pageSize', '10');
        searchUrl.searchParams.append('effectiveAccountId', effectiveAccountId);

        // ===== CALL SALESFORCE COMMERCE API =====
        const response = await fetch(searchUrl.toString(), {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Salesforce API error:', error);
            throw new Error(
                `Salesforce API returned ${response.status}: ${error}`
            );
        }

        const commerceData = await response.json();

        // Defensive: ensure results is an array
        const rawResults = Array.isArray(commerceData?.results) ? commerceData.results : [];

        // ===== NORMALIZE RESPONSE =====
        const products: NormalizedProduct[] = rawResults.map((product: any) =>
            normalizeProduct(product as CommerceProduct)
        );

        return NextResponse.json({
            success: true,
            message: products.length > 0 
                ? `Found ${products.length} product(s)`
                : 'No products found',
            products,
        });
    } catch (error) {
        console.error('Search API error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error',
                products: [],
            },
            { status: 500 }
        );
    }
}
