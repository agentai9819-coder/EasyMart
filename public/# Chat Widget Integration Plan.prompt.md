# Chat Widget Integration Plan

## System Architecture

This is a system where a Salesforce LWC ONLY injects an external chat widget script.

### Key Context
- **Salesforce LWC (ChatWidgetEmbed)**: Script injection only
- **Chat Widget**: Plain JavaScript hosted in Next.js project (`/public/chat-widget.js`)
- **Widget Runtime**: Runs inside Salesforce pages
- **Communication**: Widget may ONLY communicate with Next.js backend via `fetch()`

### Architecture Stack
- Salesforce LWC: Script injection only
- Browser widget: UI logic only
- Next.js backend: API routes
- Salesforce Apex: REST APIs
- Auth: OAuth JWT Bearer Flow
- Commerce: Salesforce Commerce APIs

## Absolute Rules (Non-Negotiable)

- ❌ DO NOT add logic to LWC
- ❌ DO NOT use LWC to call Apex
- ❌ DO NOT dispatch DOM events between LWC and widget
- ❌ DO NOT call Salesforce APIs from the browser
- ❌ DO NOT store Salesforce tokens in widget code
- ❌ DO NOT refactor widget UI structure

## Salesforce Data Model (Exact)

| Component | Details |
|-----------|---------|
| Product Object | `Product2` |
| SKU Field | `StockKeepingUnit` |
| Price Source | `PricebookEntry` (where `Product2Id` linked, `IsActive = true`) |
| Image Source | `ProductMedia` (queried separately in Apex) |

## Features to Implement

### 1. Product Search
- User enters text in chat widget
- Widget calls `POST /api/search`
- Backend authenticates using JWT
- Backend calls Apex `ProductSearchApi`
- Widget renders product cards

### 2. Product Cards (Plain JS)
Rendered inside chat window with:
- Image
- Name
- SKU
- Price
- Buttons: View Details, Add to Cart

### 3. Add to Cart
- Widget calls `POST /api/cart/add`
- Backend calls Apex `CartApi`
- Apex uses Commerce APIs
- Widget shows success/error message

## Apex API Requirements

### ProductSearchApi
- Query `Product2` records (LIMIT 10)
- Collect `Product2` IDs
- Query `PricebookEntry` separately
- Query `ProductMedia` separately
- Use Maps (no nested loops)

### CartApi
- Create or reuse cart
- Add cart items
- Validate inputs

## Implementation Order (Mandatory)

1. ⚙️ Apex REST APIs
2. 🔐 Backend JWT authentication
3. 🛣️ Backend API routes
4. 💻 Widget JS logic (replace mock response only)
5. 🎨 Product cards + cart wiring

## Implementation Details

### Backend API Endpoints

#### POST /api/search
**Request:**
```json
{
  "query": "product search term"
}
```

**Response:**
```json
{
  "products": [
    {
      "id": "Product2 ID",
      "name": "Product Name",
      "sku": "SKU",
      "price": 99.99,
      "image": "image URL"
    }
  ]
}
```

#### POST /api/cart/add
**Request:**
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
  "message": "Added to cart",
  "cartId": "cart ID"
}
```

### Widget JavaScript Structure

- Chat input handler → calls `/api/search`
- Product card renderer → displays search results
- Add to Cart handler → calls `/api/cart/add`
- Success/error feedback → displayed in chat

### Backend JWT Flow

1. Backend receives request from widget
2. Backend uses stored Salesforce credentials (JWT)
3. Backend calls Salesforce Apex REST endpoint
4. Response returned to widget

## Notes

- All Salesforce data access happens in Apex
- All Salesforce authentication happens in Next.js backend
- Widget never directly calls Salesforce
- Widget never stores or handles tokens
- Widget focus: UI rendering and user interaction only
