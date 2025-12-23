/**
 * Salesforce JWT Bearer Flow Authentication
 * Uses environment variables for all credentials
 * No hardcoded values
 */

import crypto from 'crypto';

interface JWTPayload {
    iss: string;
    sub: string;
    aud: string;
    exp: number;
}

interface TokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
}

function base64UrlEncode(input: string | Buffer) {
    const b = Buffer.isBuffer(input) ? input : Buffer.from(String(input));
    return b.toString('base64').replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function obtainAccessToken(): Promise<{ token: string; expiresIn: number }> {
    const SALESFORCE_CLIENT_ID = process.env.SALESFORCE_CLIENT_ID;
    const SALESFORCE_USERNAME = process.env.SALESFORCE_USERNAME;
    let SALESFORCE_PRIVATE_KEY = process.env.SALESFORCE_PRIVATE_KEY;
    const SALESFORCE_LOGIN_URL = process.env.SALESFORCE_LOGIN_URL;

    if (!SALESFORCE_CLIENT_ID || !SALESFORCE_USERNAME || !SALESFORCE_PRIVATE_KEY || !SALESFORCE_LOGIN_URL) {
        throw new Error('Missing Salesforce JWT auth environment variables');
    }

    SALESFORCE_PRIVATE_KEY = SALESFORCE_PRIVATE_KEY.replace(/\\n/g, '\n');

    const header = { alg: 'RS256', typ: 'JWT' };
    const exp = Math.floor(Date.now() / 1000) + 180; // 3 minutes
    const payload: JWTPayload = {
        iss: SALESFORCE_CLIENT_ID,
        sub: SALESFORCE_USERNAME,
        aud: SALESFORCE_LOGIN_URL,
        exp,
    };

    const signingInput = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}`;
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(signingInput);
    sign.end();
    const signature = sign.sign(SALESFORCE_PRIVATE_KEY as string);
    const jwt = `${signingInput}.${base64UrlEncode(signature)}`;

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

    const data: TokenResponse = await resp.json();
    if (!data?.access_token) throw new Error('Salesforce token response missing access_token');
    return { token: data.access_token, expiresIn: data.expires_in || 3600 };
}

/**
 * Call Salesforce Apex REST API endpoint
 * @param endpoint Apex REST endpoint (e.g., /services/apexrest/ProductSearchApi)
 * @param method HTTP method (GET, POST, etc.)
 * @param body Request body for POST requests
 * @returns API response
 */
async function callSalesforceApi(
    endpoint: string,
    method: string = 'GET',
    body?: any
): Promise<any> {
    try {
        if (!(global as any).__sf_token_cache) {
            (global as any).__sf_token_cache = { token: null, expiresAt: 0 };
        }
        const cache = (global as any).__sf_token_cache as { token: string | null; expiresAt: number };
        const now = Date.now();
        if (!cache.token || !cache.expiresAt || now >= cache.expiresAt) {
            const { token, expiresIn } = await obtainAccessToken();
            cache.token = token;
            cache.expiresAt = Date.now() + expiresIn * 1000 - 30 * 1000; // buffer 30s
        }

        const accessToken = cache.token as string;

        const apiUrl = new URL(endpoint, process.env.SALESFORCE_INSTANCE_URL!);

        const fetchOptions: RequestInit = {
            method,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        };

        // Include body for methods that support a request payload (POST, PATCH, PUT, DELETE)
        if (body && method !== 'GET' && method !== 'HEAD') {
            fetchOptions.body = JSON.stringify(body);
        }

        const response = await fetch(apiUrl.toString(), fetchOptions);

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Salesforce API error: ${response.status} ${error}`);
        }

        return await response.json();
    } catch (error) {
        throw new Error(`Salesforce API call failed: ${error}`);
    }
}

export { callSalesforceApi };
