/**
 * Salesforce JWT Bearer Flow Authentication
 * Uses environment variables for all credentials
 * No hardcoded values
 */

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

/**
 * Generate JWT token for Salesforce OAuth authentication
 * @returns JWT token string
 */
function generateJWT(): string {
    const header = {
        alg: 'RS256',
        typ: 'JWT',
    };

    // Token valid for 2 minutes
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresIn = 120;

    const payload: JWTPayload = {
        iss: process.env.SALESFORCE_CLIENT_ID!,
        sub: process.env.SALESFORCE_USERNAME!,
        aud: process.env.SALESFORCE_LOGIN_URL!,
        exp: issuedAt + expiresIn,
    };

    // NOTE: This is a template structure
    // In production, you will:
    // 1. Read the private key from process.env.SALESFORCE_PRIVATE_KEY
    // 2. Use a JWT library (e.g., jsonwebtoken) to sign
    // 3. Return the signed token

    // Example with jsonwebtoken library:
    // const jwt = require('jsonwebtoken');
    // const token = jwt.sign(payload, process.env.SALESFORCE_PRIVATE_KEY, { 
    //     algorithm: 'RS256',
    //     header: header 
    // });
    // return token;

    throw new Error('JWT generation not yet implemented. Add jsonwebtoken library to handle RS256 signing.');
}

/**
 * Exchange JWT for access token
 * @param jwtToken JWT token from generateJWT()
 * @returns Access token for API calls
 */
async function getAccessToken(jwtToken: string): Promise<string> {
    const tokenUrl = new URL('/services/oauth2/token', process.env.SALESFORCE_LOGIN_URL!);

    try {
        const response = await fetch(tokenUrl.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                assertion: jwtToken,
            }).toString(),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OAuth token exchange failed: ${error}`);
        }

        const tokenData: TokenResponse = await response.json();
        return tokenData.access_token;
    } catch (error) {
        throw new Error(`Failed to obtain access token: ${error}`);
    }
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
        // Step 1: Generate JWT token
        const jwt = generateJWT();

        // Step 2: Exchange JWT for access token
        const accessToken = await getAccessToken(jwt);

        // Step 3: Call Apex REST API
        const apiUrl = new URL(endpoint, process.env.SALESFORCE_INSTANCE_URL!);

        const fetchOptions: RequestInit = {
            method,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        };

        if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
            fetchOptions.body = JSON.stringify(body);
        }

        const response = await fetch(apiUrl.toString(), fetchOptions);

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Salesforce API error: ${error}`);
        }

        return await response.json();
    } catch (error) {
        throw new Error(`Salesforce API call failed: ${error}`);
    }
}

export { generateJWT, getAccessToken, callSalesforceApi };
