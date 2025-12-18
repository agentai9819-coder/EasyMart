# System Architecture Diagram

## High-Level Flow

```
┌────────────────────────────────────────────────────────────────────┐
│                     Salesforce Org                                 │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ChatWidgetEmbed (LWC Component)                          │   │
│  │ ─────────────────────────────────────                   │   │
│  │ • Injects external script tag only                      │   │
│  │ • No business logic                                     │   │
│  │ • Loads: https://domain.com/chat-widget.js            │   │
│  │                                                        │   │
│  └───────────────────┬──────────────────────────────────┘   │
│                      │                                       │
│                      ▼ (Script injection)                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ProductSearchApi (Apex REST)                             │   │
│  │ ─────────────────────────────────────                   │   │
│  │ POST /services/apexrest/ProductSearchApi                │   │
│  │ • Query Product2 (LIMIT 10)                             │   │
│  │ • Query PricebookEntry (separate)                       │   │
│  │ • Query ProductMedia (separate)                         │   │
│  │ • Use Maps for correlation                              │   │
│  │ • Return: products array                                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ CartApi (Apex REST)                                      │   │
│  │ ─────────────────────────────────────                   │   │
│  │ POST /services/apexrest/CartApi                         │   │
│  │ • Validate product exists                                │   │
│  │ • Create/retrieve cart                                   │   │
│  │ • Add items to cart                                      │   │
│  │ • Return: cartId, message                                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

## Browser to Backend Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    Browser (Widget)                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Chat Widget (public/chat-widget.js)                │    │
│  │ ────────────────────────────────────────────────   │    │
│  │                                                    │    │
│  │  Search:                                          │    │
│  │  • User enters "laptop"                           │    │
│  │  • Click Send                                     │    │
│  │  • fetch POST /api/search                         │    │
│  │    { query: "laptop" }                            │    │
│  │                                                    │    │
│  │  Add to Cart:                                     │    │
│  │  • User clicks "Add to Cart"                      │    │
│  │  • fetch POST /api/cart/add                       │    │
│  │    { productId: "ID", quantity: 1 }               │    │
│  │                                                    │    │
│  │  Display:                                         │    │
│  │  • Product cards rendered                         │    │
│  │  • Success/error messages shown                   │    │
│  │                                                    │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
         │                              │
         │ POST /api/search             │ POST /api/cart/add
         │ { query }                    │ { productId, quantity, sku }
         │                              │
         ▼                              ▼
┌──────────────────────────────────────────────────────────────┐
│                  Next.js Backend                             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────┐  ┌──────────────────────┐  │
│  │ API Route: /api/search     │  │ API Route: /api/cart │  │
│  │ ──────────────────────────  │  │ /add                 │  │
│  │ 1. Validate query           │  │ ──────────────────  │  │
│  │ 2. callSalesforceApi()      │  │ 1. Validate inputs  │  │
│  │ 3. Return products          │  │ 2. callSalesforceApi│  │
│  │                             │  │ 3. Return result    │  │
│  └────────────────────────────┘  └──────────────────────┘  │
│                │                              │              │
│                ▼ callSalesforceApi()          ▼              │
│  ┌──────────────────────────────────────────────────┐        │
│  │ salesforceAuth Module                           │        │
│  │ ─────────────────────────────────────           │        │
│  │ 1. generateJWT()                                │        │
│  │    • Header: { alg: RS256, typ: JWT }           │        │
│  │    • Payload: { iss, sub, aud, exp }            │        │
│  │    • Sign with SALESFORCE_PRIVATE_KEY (env)    │        │
│  │                                                 │        │
│  │ 2. getAccessToken(jwt)                          │        │
│  │    • POST /services/oauth2/token                │        │
│  │    • grant_type: jwt-bearer                     │        │
│  │    • Exchange JWT for access_token              │        │
│  │                                                 │        │
│  │ 3. callSalesforceApi(endpoint, method, body)    │        │
│  │    • Build request with Bearer token            │        │
│  │    • Call Apex REST endpoint                    │        │
│  │    • Return response                            │        │
│  │                                                 │        │
│  └──────────────────────────────────────────────────┘        │
│                │                       │                     │
│                ▼                       ▼                     │
│   /services/apexrest/ProductSearchApi  /services/apexrest/CartApi
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Authentication Flow (JWT Bearer)

```
Step 1: Generate JWT Token
─────────────────────────────
generateJWT() called with env vars:
• SALESFORCE_CLIENT_ID (iss)
• SALESFORCE_USERNAME (sub)
• SALESFORCE_LOGIN_URL (aud)
• SALESFORCE_PRIVATE_KEY (RS256 signing key)

JWT Structure:
┌─────────────────────┐
│ Header              │
│ {                   │
│  "alg": "RS256",    │
│  "typ": "JWT"       │
│ }                   │
├─────────────────────┤
│ Payload             │
│ {                   │
│  "iss": client_id,  │
│  "sub": username,   │
│  "aud": login_url,  │
│  "exp": now + 120s  │
│ }                   │
├─────────────────────┤
│ Signature (RS256)   │
│ HMACSHA256(        │
│   base64header +    │
│   base64payload,    │
│   private_key       │
│ )                   │
└─────────────────────┘


Step 2: Exchange JWT for Access Token
──────────────────────────────────────
POST https://login.salesforce.com/services/oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer
&assertion=<JWT_TOKEN>

Response:
{
  "access_token": "00D...",
  "token_type": "Bearer",
  "expires_in": 3600
}


Step 3: Call Apex REST API
──────────────────────────
GET/POST https://instance.salesforce.com/services/apexrest/...
Authorization: Bearer <access_token>
Content-Type: application/json

{
  ...request body...
}

Response:
{
  "success": true,
  "message": "...",
  "data": {...}
}
```

## Product Search Query Sequence

```
Widget User Input: "laptop"
        │
        ▼
POST /api/search { query: "laptop" }
        │
        ▼
Backend validates query ✓
        │
        ▼
JWT Authentication Flow (Step 1-3 above)
        │
        ▼
Apex: ProductSearchApi received
        │
        ├─ Step 1: Query Product2
        │  SELECT Id, Name, StockKeepingUnit
        │  FROM Product2
        │  WHERE IsActive = true
        │  AND Name LIKE '%laptop%'
        │  LIMIT 10
        │  ▼ Result: [Product2 records]
        │
        ├─ Step 2: Collect Product2 IDs
        │  productIds = {ID1, ID2, ID3, ...}
        │
        ├─ Step 3: Query PricebookEntry (separate)
        │  SELECT Id, Product2Id, UnitPrice, IsActive
        │  FROM PricebookEntry
        │  WHERE Product2Id IN :productIds
        │  AND IsActive = true
        │  AND Pricebook2.IsStandard = true
        │  ▼ Result: Map<Id, PricebookEntry>
        │
        ├─ Step 4: Query ProductMedia (separate)
        │  SELECT Id, Product2Id, SourceUrl
        │  FROM ProductMedia
        │  WHERE Product2Id IN :productIds
        │  ▼ Result: Map<Id, ProductMedia>
        │
        └─ Step 5: Build Response
           FOR each product:
           • Get price from priceMap
           • Get image from mediaMap
           • Add to results
           ▼ Return products array
        │
        ▼
Backend receives Apex response
        │
        ├─ Transform format for widget
        │  {
        │    "success": true,
        │    "message": "Products found",
        │    "products": [
        │      {
        │        "id": "...",
        │        "name": "...",
        │        "sku": "...",
        │        "price": 99.99,
        │        "imageUrl": "..."
        │      }
        │    ]
        │  }
        │
        └─ Return to widget
           │
           ▼
Widget receives response
        │
        ├─ Remove loading state
        │
        ├─ FOR each product:
        │  • Create product card div
        │  • Add image
        │  • Add name, SKU, price
        │  • Add "View Details" button
        │  • Add "Add to Cart" button
        │  • Append to chat window
        │
        └─ Show products to user
```

## Add to Cart Sequence

```
User clicks "Add to Cart" on Product Card
        │
        ▼
Show loading state on button
        │
        ▼
POST /api/cart/add {
  productId: "001xx...",
  quantity: 1,
  sku: "SKU-12345"
}
        │
        ▼
Backend validates inputs
• productId not empty ✓
• quantity > 0 ✓
        │
        ▼
JWT Authentication Flow
        │
        ▼
Apex: CartApi received
        │
        ├─ Step 1: Validate Product
        │  SELECT Id, Name, StockKeepingUnit
        │  FROM Product2
        │  WHERE Id = :productId
        │  AND IsActive = true
        │  ✓ Product exists and active
        │
        ├─ Step 2: Get or Create Cart
        │  • Check Integration User has cart
        │  • Or create new cart
        │  • Get cartId
        │
        ├─ Step 3: Add Item to Cart
        │  • Use Commerce APIs
        │  • Add product + quantity
        │  • Confirm add successful
        │
        └─ Return Response:
           {
             "success": true,
             "message": "Item added",
             "cartId": "CART-123",
             "productName": "...",
             "quantity": 1
           }
        │
        ▼
Backend returns response
        │
        ▼
Widget receives response
        │
        ├─ Remove loading state
        │
        ├─ Check response.success
        │  │
        │  ├─ TRUE: Show GREEN success message
        │  │  "✓ Product added to cart!"
        │  │
        │  └─ FALSE: Show RED error message
        │     "Error: ..."
        │
        └─ Scroll chat to show message
           User sees confirmation
```

## Data Model Relationships

```
┌──────────────────┐
│ Product2         │
├──────────────────┤
│ Id (PK)          │
│ Name             │
│ StockKeepingUnit │ ◄─────┐
│ Family           │       │
│ IsActive         │       │
│ Description      │       │
└──────────────────┘       │
        │ 1                │
        │                  │
      1 │ ─ Many           │
        │                  │
        ▼                  │
┌──────────────────┐       │
│ PricebookEntry   │       │
├──────────────────┤       │
│ Id (PK)          │       │
│ Product2Id (FK)  ├───────┘
│ Pricebook2Id     │
│ UnitPrice        │ ◄─ Used for price
│ IsActive         │
└──────────────────┘

        │ 1
        │
      1 │ ─ Many
        │
        ▼
┌──────────────────┐
│ ProductMedia     │
├──────────────────┤
│ Id (PK)          │
│ Product2Id (FK)  ├───────┐
│ MediaProvider    │       │
│ SourceUrl        │ ◄─ Used for image
│ Title            │
│ MediaType        │
└──────────────────┘


Widget Search Result Combines:
┌────────────────────────────────────────┐
│ Search Result Object                   │
├────────────────────────────────────────┤
│ id          ← From Product2.Id         │
│ name        ← From Product2.Name       │
│ sku         ← From Product2.SKU        │
│ price       ← From PricebookEntry.*    │
│ imageUrl    ← From ProductMedia.URL    │
└────────────────────────────────────────┘
```

## Environment Variables

```
.env.local (Local Development)
─────────────────────────────────────────
SALESFORCE_CLIENT_ID=3MVG9QDx8IX2...
SALESFORCE_USERNAME=integration_user@org.salesforce.com
SALESFORCE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
SALESFORCE_LOGIN_URL=https://login.salesforce.com
SALESFORCE_INSTANCE_URL=https://d5000001234567.my.salesforce.com


Vercel / Hosting Platform (Production)
─────────────────────────────────────────
Environment Variables:
[Settings > Environment Variables]
• SALESFORCE_CLIENT_ID
• SALESFORCE_USERNAME
• SALESFORCE_PRIVATE_KEY
• SALESFORCE_LOGIN_URL
• SALESFORCE_INSTANCE_URL
```

## Security Architecture

```
Browser (Untrusted)
    │
    ├─ ❌ NO: Salesforce tokens
    ├─ ❌ NO: Private keys
    ├─ ❌ NO: Credentials
    └─ ✓ YES: API calls to Next.js
        │
        ▼
Next.js Backend (Trusted)
    │
    ├─ ✓ YES: Stores environment variables
    ├─ ✓ YES: Generates JWT tokens
    ├─ ✓ YES: Handles OAuth
    └─ ✓ YES: Calls Apex REST APIs
        │
        ├─ Private key (RS256)
        ├─ Bearer token (short-lived)
        └─ Integration User context
        │
        ▼
Salesforce Org (Trusted)
    │
    ├─ ✓ YES: Validates JWT signature
    ├─ ✓ YES: Grants access token
    └─ ✓ YES: Executes Apex code
        │
        └─ Returns data to backend only
            │
            └─ Backend returns safe response to widget
```

---

Complete system architected for security, scalability, and maintainability! 🏗️
