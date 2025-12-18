# API Contracts Reference

## Backend API Endpoints

### 1. POST /api/search

**Purpose:** Search for products by query string

**Request:**
```json
{
  "query": "search term"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Products found successfully",
  "products": [
    {
      "id": "001xx000000001AAA",
      "name": "Product Name",
      "sku": "SKU-12345",
      "price": 99.99,
      "imageUrl": "https://example.com/image.jpg"
    }
  ]
}
```

**Error Response (400/500):**
```json
{
  "error": "Error message",
  "products": []
}
```

**Validation:**
- `query` must be non-empty string
- Returns up to 10 products
- Calls Apex ProductSearchApi

---

### 2. POST /api/cart/add

**Purpose:** Add product to cart

**Request:**
```json
{
  "productId": "001xx000000001AAA",
  "quantity": 1,
  "sku": "SKU-12345"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Item added to cart successfully",
  "cartId": "CART-1234567890",
  "productName": "Product Name",
  "quantity": 1
}
```

**Error Response (400/500):**
```json
{
  "success": false,
  "error": "Error message"
}
```

**Validation:**
- `productId` is required, non-empty string
- `quantity` must be positive integer
- Validates product exists in Salesforce
- Calls Apex CartApi

---

## Apex REST API Endpoints

### 1. Apex: ProductSearchApi

**Endpoint:** `POST /services/apexrest/ProductSearchApi`

**Request Body:**
```json
{
  "query": "search term"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Products found successfully",
  "products": [
    {
      "id": "Product2 ID",
      "name": "Product Name",
      "sku": "SKU",
      "price": 99.99,
      "image": "Image URL"
    }
  ]
}
```

**Data Sources:**
1. Queries Product2 (LIMIT 10)
2. Queries PricebookEntry separately (Standard Pricebook)
3. Queries ProductMedia separately
4. Uses Maps to correlate data (no nested loops)

**Error Handling:**
- Empty query: Returns message "Search query cannot be empty"
- No results: Returns empty products array with message
- Query error: Returns success=false with exception message

---

### 2. Apex: CartApi

**Endpoint:** `POST /services/apexrest/CartApi`

**Request Body:**
```json
{
  "productId": "Product2 ID",
  "quantity": 1,
  "sku": "SKU"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Item added to cart successfully",
  "cartId": "CART-ID",
  "productName": "Product Name",
  "quantity": 1
}
```

**Operations:**
1. Validates productId (required)
2. Validates quantity > 0
3. Verifies product exists and is active
4. Gets or creates cart for Integration User
5. Adds item to cart via Commerce APIs

**Error Handling:**
- Missing productId: Returns message "Product ID is required"
- Invalid quantity: Returns message "Quantity must be greater than zero"
- Inactive product: Returns message "Product not found or is inactive"
- API error: Returns success=false with exception message

---

## Data Flow Example

### Search Flow:
```
Widget (POST /api/search)
  ↓ {query: "laptop"}
Backend Route (/api/search)
  ↓ validateEnvironment()
  ↓ callSalesforceApi()
    ↓ generateJWT()
    ↓ getAccessToken()
Apex (ProductSearchApi)
  ↓ Query Product2
  ↓ Collect IDs
  ↓ Query PricebookEntry (separate)
  ↓ Query ProductMedia (separate)
  ↓ Build Maps
  ↓ Return results
Backend Route
  ↓ Transform response
Widget (Display cards)
```

### Cart Flow:
```
Widget (POST /api/cart/add)
  ↓ {productId, quantity, sku}
Backend Route (/api/cart/add)
  ↓ validateEnvironment()
  ↓ Validate inputs
  ↓ callSalesforceApi()
    ↓ generateJWT()
    ↓ getAccessToken()
Apex (CartApi)
  ↓ Validate product
  ↓ Get/Create cart
  ↓ Add item
  ↓ Return confirmation
Backend Route
  ↓ Return success
Widget (Show message)
```

---

## Environment Variables Required

```
SALESFORCE_CLIENT_ID=connected_app_client_id
SALESFORCE_USERNAME=integration_user@org.salesforce.com
SALESFORCE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
SALESFORCE_LOGIN_URL=https://login.salesforce.com
SALESFORCE_INSTANCE_URL=https://yourinstance.salesforce.com
```

---

## Error Codes

| Code | Endpoint | Meaning |
|------|----------|---------|
| 400 | /api/search | Invalid query format |
| 400 | /api/cart/add | Missing/invalid product ID or quantity |
| 500 | /api/search | Search failed, Apex error |
| 500 | /api/cart/add | Cart operation failed |

---

## Widget Integration Example

```html
<!-- Salesforce LWC -->
<template>
    <script src="https://your-domain.com/chat-widget.js"></script>
</template>
```

```javascript
// chat-widget.js makes these calls:

// Search
fetch('/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'laptop' })
})

// Add to Cart
fetch('/api/cart/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        productId: '001xx000000001AAA',
        quantity: 1,
        sku: 'SKU-12345'
    })
})
```

---

## Testing Curl Commands

### Test Search:
```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "laptop"}'
```

### Test Add to Cart:
```bash
curl -X POST http://localhost:3000/api/cart/add \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "001xx000000001AAA",
    "quantity": 1,
    "sku": "SKU-12345"
  }'
```

---

## Notes

- All timestamps in ISO 8601 format
- Prices in USD (configurable in pricebook)
- Product IDs are Salesforce record IDs (18-char)
- SKU is unique per product (can be null)
- Images from ProductMedia (optional)
- Cart managed server-side only
- No client-side state or tokens
