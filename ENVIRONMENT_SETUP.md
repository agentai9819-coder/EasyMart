# Environment Setup Guide

## Overview

This guide explains how to set up Salesforce credentials for the chat widget backend. All sensitive values must be stored in environment variables—**never hardcode credentials**.

---

## Prerequisites

1. **Salesforce Connected App** (already created)
   - OAuth enabled
   - Private key generated
   - Scopes configured

2. **Integration User** (created in Salesforce)
   - Username: `integration_user@org.salesforce.com`
   - Connected App assigned
   - API access enabled

3. **Next.js Project** (running locally or deployed)

---

## Step 1: Gather Salesforce Credentials

### Get Connected App Details:

1. Log in to Salesforce org
2. Navigate to **Setup > Apps > App Manager**
3. Find your Connected App
4. Click "View" next to the app name
5. Copy these values:
   - **Client ID** (under "API (Enable OAuth Settings)")
   - **Private Key** (if not saved, regenerate at the bottom)

### Get Login & Instance URLs:

- **Login URL**: `https://login.salesforce.com` (production)
  - Or `https://test.salesforce.com` (sandbox)
- **Instance URL**: `https://yourinstance.salesforce.com`
  - Find in your Salesforce URL or Settings > System Overview

### Get Integration User Username:

- Username in Salesforce: `integration_user@org.salesforce.com`

---

## Step 2: Create .env.local File

### Local Development:

1. In project root, create file: `.env.local`
2. Copy content from `.env.local.template`:

```bash
# In terminal, from project root:
cp .env.local.template .env.local
```

3. Edit `.env.local` and fill in your values:

```
SALESFORCE_CLIENT_ID=3MVG9QDx8IX2sP5TBxxxxxxxxxxx
SALESFORCE_USERNAME=integration_user@org.salesforce.com
SALESFORCE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7...
...full private key content here...
-----END PRIVATE KEY-----"
SALESFORCE_LOGIN_URL=https://login.salesforce.com
SALESFORCE_INSTANCE_URL=https://d5000001234567.my.salesforce.com
```

### Important: Multi-line Private Key

Private keys span multiple lines. Format options:

**Option A: Escape newlines**
```
SALESFORCE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n-----END PRIVATE KEY-----"
```

**Option B: Raw multi-line** (Next.js .env.local supports this)
```
SALESFORCE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQ...
-----END PRIVATE KEY-----"
```

### Verify Setup:

After editing `.env.local`, restart Next.js:
```bash
npm run dev
```

If environment variables are missing, you'll see:
```
Error: Missing required environment variables: SALESFORCE_CLIENT_ID, ...
```

---

## Step 3: Production Deployment

### For Vercel:

1. Push code to GitHub (without `.env.local`)
2. In Vercel dashboard:
   - Go to **Settings > Environment Variables**
   - Add each variable:
     - `SALESFORCE_CLIENT_ID`
     - `SALESFORCE_USERNAME`
     - `SALESFORCE_PRIVATE_KEY`
     - `SALESFORCE_LOGIN_URL`
     - `SALESFORCE_INSTANCE_URL`
3. Redeploy project

### For Node.js Server:

1. Set environment variables before starting:

```bash
# Option A: Export before npm start
export SALESFORCE_CLIENT_ID=your_client_id
export SALESFORCE_USERNAME=integration_user@org
export SALESFORCE_PRIVATE_KEY="$(cat /path/to/private-key.pem)"
export SALESFORCE_LOGIN_URL=https://login.salesforce.com
export SALESFORCE_INSTANCE_URL=https://yourinstance.salesforce.com
npm start

# Option B: Create .env in production
# (Same format as .env.local)
npm start
```

2. Or use PM2/systemd to manage environment:

```bash
# .env.production
SALESFORCE_CLIENT_ID=...
SALESFORCE_USERNAME=...
SALESFORCE_PRIVATE_KEY=...
SALESFORCE_LOGIN_URL=...
SALESFORCE_INSTANCE_URL=...

# Start with PM2
pm2 start npm --name chat-widget -- start --env production
```

### For Docker:

1. Create Dockerfile:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

2. Run with environment variables:

```bash
docker build -t chat-widget .
docker run \
  -e SALESFORCE_CLIENT_ID=your_id \
  -e SALESFORCE_USERNAME=user@org \
  -e SALESFORCE_PRIVATE_KEY="$(cat key.pem)" \
  -e SALESFORCE_LOGIN_URL=https://login.salesforce.com \
  -e SALESFORCE_INSTANCE_URL=https://instance.salesforce.com \
  -p 3000:3000 \
  chat-widget
```

---

## Step 4: Verify Connection

### Test Backend Locally:

```bash
# Terminal 1: Start Next.js
npm run dev

# Terminal 2: Test search endpoint
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}'
```

Expected response:
```json
{
  "success": true,
  "message": "Products found successfully",
  "products": []
}
```

If you get "Missing required environment variables", check:
1. `.env.local` file exists in project root
2. All 5 variables are present
3. No extra spaces around `=` signs
4. Private key has proper newlines

If you get "OAuth token exchange failed", check:
1. Client ID is correct
2. Private key matches client ID
3. Login URL is correct
4. Integration User has API access

---

## Step 5: Security Checklist

### Development:
- [ ] `.env.local` created (copy from template)
- [ ] All 5 variables filled in
- [ ] `.env.local` listed in `.gitignore`
- [ ] No credentials committed to Git

### Production:
- [ ] Environment variables set in hosting platform
- [ ] Private key properly escaped/formatted
- [ ] HTTPS enabled for all API calls
- [ ] Credentials not in code or config files
- [ ] Limited access to environment variable settings

### Salesforce Org:
- [ ] Connected App OAuth enabled
- [ ] Integration User has API access
- [ ] Correct scopes assigned to app
- [ ] IP restrictions configured (if needed)

---

## Troubleshooting

### "Missing required environment variables"

**Problem:** Backend can't find credentials

**Solution:**
1. Create `.env.local` in project root
2. Copy from `.env.local.template`
3. Fill in all 5 variables
4. Restart `npm run dev`
5. Check for typos in variable names

### "SALESFORCE_PRIVATE_KEY is undefined"

**Problem:** Private key not reading correctly

**Solution:**
1. Verify private key format:
   ```bash
   # Check key starts and ends with markers
   cat key.pem | head -1  # Should be: -----BEGIN PRIVATE KEY-----
   cat key.pem | tail -1  # Should be: -----END PRIVATE KEY-----
   ```

2. Ensure proper escaping in `.env.local`:
   - Multi-line format OK: Press Enter between lines
   - OR use `\n` escape sequences
   - Don't mix both styles

3. Test with simpler value first:
   ```
   TEST_VAR="hello world"
   ```
   If TEST_VAR works but SALESFORCE_PRIVATE_KEY doesn't, it's a format issue.

### "OAuth token exchange failed"

**Problem:** Salesforce rejects JWT token

**Solution:**
1. Verify Client ID:
   ```bash
   grep SALESFORCE_CLIENT_ID .env.local
   # Should match Connected App in Salesforce
   ```

2. Verify username:
   ```bash
   grep SALESFORCE_USERNAME .env.local
   # Should be integration_user@org.salesforce.com
   ```

3. Regenerate private key in Connected App:
   - Setup > Apps > App Manager
   - View Connected App
   - Manage Consumer Details (reveal)
   - Generate new private key
   - Copy entire new key to `.env.local`

4. Verify login URL:
   - Production: `https://login.salesforce.com`
   - Sandbox: `https://test.salesforce.com`

### "Product not found" in search results

**Problem:** Backend connected to Salesforce but no products returned

**Solution:**
1. Verify products exist in Salesforce:
   - Setup > Data > Search
   - Search for "Product2"
   - Check records exist

2. Verify IsActive = true:
   - Open product record
   - Check "Active" checkbox is selected

3. Verify pricebook entries:
   - Setup > Data > Search
   - Search for "PricebookEntry"
   - Ensure entries linked to products in Standard Pricebook

4. Check API query works in Apex:
   - Setup > Developer Console
   - Execute Anonymous window:
   ```apex
   List<Product2> products = [SELECT Id, Name FROM Product2 WHERE IsActive = true LIMIT 10];
   System.debug(products);
   ```

---

## Environment Variable Reference

| Variable | Example | Notes |
|----------|---------|-------|
| SALESFORCE_CLIENT_ID | `3MVG9QDx8IX2...` | 24+ char string from Connected App |
| SALESFORCE_USERNAME | `integration_user@org.salesforce.com` | Integration User email |
| SALESFORCE_PRIVATE_KEY | `-----BEGIN PRIVATE KEY-----...` | Multi-line PEM format |
| SALESFORCE_LOGIN_URL | `https://login.salesforce.com` | Production or test.salesforce.com |
| SALESFORCE_INSTANCE_URL | `https://d5000001234567.my.salesforce.com` | Your org URL |

---

## Quick Start

```bash
# 1. Copy template
cp .env.local.template .env.local

# 2. Edit with your values
nano .env.local

# 3. Save and restart Next.js
npm run dev

# 4. Test
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}'
```

Done! ✅ Backend is now connected to Salesforce.
