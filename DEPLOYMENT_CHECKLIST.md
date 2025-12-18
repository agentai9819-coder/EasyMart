# Salesforce Chat Widget - Implementation Checklist

## Pre-Deployment Verification

### Apex Classes
- [x] **ProductSearchApi.cls**
  - Queries Product2 (LIMIT 10)
  - Separately queries PricebookEntry (Standard Pricebook)
  - Separately queries ProductMedia
  - Uses Maps (no nested loops)
  - Returns: id, name, sku, price, image

- [x] **CartApi.cls**
  - Validates product exists
  - Validates quantity > 0
  - Gets/creates cart
  - Adds items to cart
  - Returns: success, message, cartId, productName, quantity

### Backend Authentication
- [x] **salesforceAuth.ts**
  - generateJWT() - Creates RS256 JWT
  - getAccessToken() - OAuth token exchange
  - callSalesforceApi() - Calls Apex with bearer token
  - All credentials from env vars

- [x] **envConfig.ts**
  - validateEnvironment() - Checks required vars
  - Required: CLIENT_ID, USERNAME, PRIVATE_KEY, LOGIN_URL, INSTANCE_URL

### Backend API Routes
- [x] **POST /api/search**
  - Input: { query: string }
  - Calls ProductSearchApi via JWT
  - Output: { success, message, products[] }
  - Error handling with user-friendly messages

- [x] **POST /api/cart/add**
  - Input: { productId, quantity, sku }
  - Validates inputs
  - Calls CartApi via JWT
  - Output: { success, message, cartId, productName, quantity }
  - Error handling with user-friendly messages

### Widget JavaScript
- [x] **chat-widget.js**
  - Search: Calls POST /api/search
  - Loading state
  - Product card rendering
  - Cart: Calls POST /api/cart/add
  - Success/error messages
  - Inline CSS styling

---

## Deployment Steps

### 1️⃣ Salesforce Org Setup

```
1. Create Connected App (if not done)
   - Settings > Apps > New Connected App
   - Enable OAuth
   - Generate private key
   - Create Integration User with assigned Connected App

2. Deploy Apex Classes
   - Copy ProductSearchApi.cls to org
   - Copy CartApi.cls to org
   - Create REST resources for both
   - Assign to Integration User's permission set

3. Verify Salesforce Data
   - Product2 records with:
     - IsActive = true
     - StockKeepingUnit (SKU) populated
   - PricebookEntry records with:
     - Active = true
     - Standard Pricebook
   - ProductMedia records (optional):
     - SourceUrl with image links
```

### 2️⃣ Next.js Configuration

```
1. Install JWT signing package
   npm install jsonwebtoken
   npm install --save-dev @types/jsonwebtoken

2. Create .env.local file
   (Copy from .env.local.template and fill values)
   
   SALESFORCE_CLIENT_ID=your_client_id
   SALESFORCE_USERNAME=integration_user@org.salesforce.com
   SALESFORCE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
   SALESFORCE_LOGIN_URL=https://login.salesforce.com
   SALESFORCE_INSTANCE_URL=https://yourinstance.salesforce.com

3. DO NOT commit .env.local to git
   (Already in .gitignore)
```

### 3️⃣ Test Backend Locally

```bash
# Start dev server
npm run dev

# Test /api/search
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "laptop"}'

# Test /api/cart/add
curl -X POST http://localhost:3000/api/cart/add \
  -H "Content-Type: application/json" \
  -d '{"productId": "PRODUCT_ID", "quantity": 1, "sku": "SKU"}'
```

### 4️⃣ Build and Deploy Backend

```bash
# Build Next.js
npm run build

# Deploy to hosting:
# Option A: Vercel (recommended for Next.js)
#   npx vercel
#
# Option B: Node.js server
#   npm start (requires .env.local on server)
#
# Option C: Docker container
#   docker build -t chat-widget .
#   docker run -e SALESFORCE_CLIENT_ID=... -p 3000:3000 chat-widget
```

### 5️⃣ Deploy Chat Widget Script

```
1. Host public/chat-widget.js on CDN or static server
   Example: https://cdn.example.com/chat-widget.js
            https://chat-widget.example.com/public/chat-widget.js

2. Create Salesforce LWC component:
   
   // chatWidgetEmbed.js
   import { LightningElement } from 'lwc';
   
   export default class ChatWidgetEmbed extends LightningElement {
       connectedCallback() {
           const script = document.createElement('script');
           script.src = 'https://your-domain.com/chat-widget.js';
           script.async = true;
           document.body.appendChild(script);
       }
   }

3. Create meta file (chatWidgetEmbed.js-meta.xml):
   
   <?xml version="1.0" encoding="UTF-8"?>
   <LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
       <apiVersion>59.0</apiVersion>
       <isExposed>true</isExposed>
   </LightningComponentBundle>

4. Deploy LWC to Salesforce org
```

### 6️⃣ Test Widget in Salesforce

```
1. Add LWC to Salesforce page
   - Lightning App Builder
   - Add ChatWidgetEmbed component
   - Save and activate page

2. Test functionality
   - Open page with chat button
   - Click button to open widget
   - Enter search term (e.g., "laptop")
   - Verify products appear
   - Click "Add to Cart"
   - Verify success message

3. Check browser console for errors
   - F12 > Console tab
   - All API calls should show in Network tab
```

---

## Architecture Diagram

```
┌─────────────────────────────┐
│   Salesforce Org            │
├─────────────────────────────┤
│  ChatWidgetEmbed (LWC)      │
│  └─ Injects script tag      │
│     └─ chat-widget.js       │
└──────────────┬──────────────┘
               │
               ├─ POST /api/search
               │  └─ Next.js Backend
               │     ├─ JWT Auth
               │     └─ Calls ProductSearchApi (Apex)
               │        ├─ Query Product2
               │        ├─ Query PricebookEntry
               │        └─ Query ProductMedia
               │
               └─ POST /api/cart/add
                  └─ Next.js Backend
                     ├─ JWT Auth
                     └─ Calls CartApi (Apex)
                        ├─ Create/Reuse Cart
                        └─ Add Cart Items
```

---

## Security Checklist

- [x] No Salesforce tokens in widget code
- [x] No Salesforce credentials in frontend
- [x] JWT auth only in backend
- [x] Private key from environment variables
- [x] HTTPS for production deployment
- [x] CORS headers properly set
- [x] Input validation on all API endpoints
- [x] Error messages don't leak sensitive data

---

## Troubleshooting Guide

### Issue: "Missing required environment variables"
**Solution:**
- Create `.env.local` file (copy from `.env.local.template`)
- Fill in all 5 required variables
- Restart Next.js dev server
- Verify no extra spaces around values

### Issue: "OAuth token exchange failed"
**Solution:**
- Verify Salesforce credentials are correct
- Check Connected App is OAuth enabled
- Ensure private key is valid PEM format
- Verify login URL matches your Salesforce instance
- Check Integration User has API access

### Issue: "Apex REST endpoint not found"
**Solution:**
- Verify classes deployed to Salesforce org
- Check endpoint path matches class definition
- Verify Integration User has access to Apex classes
- Check instance URL in SALESFORCE_INSTANCE_URL

### Issue: "No products showing in widget"
**Solution:**
- Check /api/search in browser DevTools Network tab
- Verify ProductSearchApi returns data
- Check Product2 records exist in Salesforce
- Verify products are Active (IsActive = true)
- Check PricebookEntry records exist for Standard Pricebook

### Issue: "Add to Cart not working"
**Solution:**
- Check /api/cart/add in DevTools Network tab
- Verify CartApi returns success
- Check product ID is valid
- Verify Integration User has Commerce API access
- Check Salesforce Commerce Cloud configuration

---

## Performance Optimization

- Widget loads as IIFE (no DOM blocking)
- API calls are async (non-blocking)
- Images lazy-loaded from ProductMedia
- Product cards rendered incrementally
- No unnecessary re-renders
- Minimal CSS (all inline, no external stylesheets)

---

## Notes

- Standard Pricebook is used by default (no pricebook selection)
- Cart created/managed server-side (no widget state)
- Integration User context used for all Apex calls
- Product search limited to 10 results per Apex spec
- All timestamps stored server-side
- Widget completely independent of LWC

---

Ready for deployment! 🚀
