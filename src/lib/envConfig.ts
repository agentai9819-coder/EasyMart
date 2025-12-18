/**
 * Environment Variables Configuration Template
 * 
 * IMPORTANT: All sensitive values must be configured in .env.local
 * DO NOT commit credentials to version control
 * DO NOT hardcode values in source code
 */

export const requiredEnvVars = [
    'SALESFORCE_CLIENT_ID',
    'SALESFORCE_USERNAME',
    'SALESFORCE_PRIVATE_KEY',
    'SALESFORCE_LOGIN_URL',
    'SALESFORCE_INSTANCE_URL',
];

export const validateEnvironment = (): void => {
    const missing = requiredEnvVars.filter(
        (varName) => !process.env[varName]
    );

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missing.join(', ')}`
        );
    }
};
