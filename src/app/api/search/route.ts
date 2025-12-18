import { NextResponse } from 'next/server';
import crypto from 'crypto';

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
 * Get Salesforce Access Token
 *
 * JWT Bearer Flow (RS256) is implemented in `getAccessToken()` and reads
 * credentials from environment variables. This function performs a server-
 * to-server JWT exchange to obtain a short-lived access token.
 */
async function getAccessToken(): Promise<string> {
    // Implement JWT Bearer Flow (RS256) using only the required env vars.
    // In-memory token cache (module-scoped)
    // NOTE: do NOT log sensitive values (private key, jwt, access_token)
    const SALESFORCE_CLIENT_ID = process.env.SALESFORCE_CLIENT_ID;
    const SALESFORCE_USERNAME = process.env.SALESFORCE_USERNAME;
    let SALESFORCE_PRIVATE_KEY = process.env.SALESFORCE_PRIVATE_KEY;
    const SALESFORCE_LOGIN_URL = process.env.SALESFORCE_LOGIN_URL;

    if (!SALESFORCE_CLIENT_ID) {
        throw new Error('Missing required env: SALESFORCE_CLIENT_ID');
    }
    if (!SALESFORCE_USERNAME) {
        throw new Error('Missing required env: SALESFORCE_USERNAME');
    }
    if (!SALESFORCE_PRIVATE_KEY) {
        throw new Error('Missing required env: SALESFORCE_PRIVATE_KEY');
    }
    if (!SALESFORCE_LOGIN_URL) {
        throw new Error('Missing required env: SALESFORCE_LOGIN_URL');
    }

    // Normalize private key: allow literal `\n` sequences in env
    SALESFORCE_PRIVATE_KEY = SALESFORCE_PRIVATE_KEY.replace(/\\n/g, '\n');

    // Simple in-memory cache stored on module scope
    // (declared lazily to avoid unused var if function never called)
    if (!(global as any).__sf_token_cache) {
        (global as any).__sf_token_cache = { token: null, expiresAt: 0 };
    }
    const cache = (global as any).__sf_token_cache as { token: string | null; expiresAt: number };

    const now = Date.now();
    if (cache.token && cache.expiresAt && now < cache.expiresAt) {
        return cache.token;
    }

    // Build JWT
    const header = { alg: 'RS256', typ: 'JWT' };
    const exp = Math.floor(Date.now() / 1000) + 180; // 3 minutes
    const payload = {
        iss: SALESFORCE_CLIENT_ID,
        sub: SALESFORCE_USERNAME,
        aud: SALESFORCE_LOGIN_URL,
        exp,
    } as Record<string, any>;

    function base64UrlEncode(input: string | Buffer) {
        const b = Buffer.isBuffer(input) ? input : Buffer.from(String(input));
        return b.toString('base64').replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    }

    const signingInput = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}`;

    // Sign using RS256
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(signingInput);
    sign.end();
    const signature = sign.sign(SALESFORCE_PRIVATE_KEY);
    const jwt = `${signingInput}.${base64UrlEncode(signature)}`;

    // Exchange JWT for access token
    const tokenUrl = `${SALESFORCE_LOGIN_URL.replace(/\/$/, '')}/services/oauth2/token`;
    const body = new URLSearchParams();
    body.append('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer');
    body.append('assertion', jwt);

    const resp = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
    });

    if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Failed to obtain access token from Salesforce: ${resp.status} ${text}`);
    }

    const data = await resp.json();
    const accessToken = data?.access_token;
    const expiresIn = typeof data?.expires_in === 'number' ? data.expires_in : parseInt(data?.expires_in || '0', 10) || 0;
    if (!accessToken) {
        throw new Error('Salesforce token response did not contain access_token');
    }

    // Cache token with a small buffer (30s)
    const ttlMs = expiresIn > 0 ? expiresIn * 1000 : 60 * 60 * 1000; // default 1h if not provided
    cache.token = accessToken;
    cache.expiresAt = Date.now() + ttlMs - 30 * 1000;

    return accessToken;
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
