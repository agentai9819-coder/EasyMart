# Implementation Reference Card

## 📌 Files Created/Modified

### Apex Classes (Deploy to Salesforce)
```
apex/ProductSearchApi.cls          NEW - REST endpoint for product search
apex/CartApi.cls                   NEW - REST endpoint for cart operations
```

### Backend Authentication (Next.js)
```
src/lib/salesforceAuth.ts          NEW - JWT generation and token exchange
src/lib/envConfig.ts               NEW - Environment variable validation
.env.local.template                NEW - Credential template
```

### Backend API Routes (Next.js)
```
src/app/api/search/route.ts        NEW - POST /api/search endpoint
src/app/api/cart/add/route.ts      NEW - POST /api/cart/add endpoint
```

### Widget & UI (Browser)
```
public/chat-widget.js              MODIFIED - Added search and cart logic
```

### Documentation
```
IMPLEMENTATION_SUMMARY.md          NEW - Feature overview
DEPLOYMENT_CHECKLIST.md            NEW - Deployment steps
API_CONTRACTS.md                   NEW - API documentation
ENVIRONMENT_SETUP.md               NEW - Credentials guide
READY_FOR_DEPLOYMENT.md            NEW - This summary
plan-chatWidget.prompt.md          NEW - Architecture plan
```

---

## 🔧 Environment Variables (Required)

```bash
SALESFORCE_CLIENT_ID               # From Connected App
SALESFORCE_USERNAME                # Integration user email
SALESFORCE_PRIVATE_KEY             # Multi-line PEM format
SALESFORCE_LOGIN_URL               # https://login.salesforce.com
SALESFORCE_INSTANCE_URL            # https://yourinstance.salesforce.com
```

---

## 📊 Data Flow Summary

### Search Flow
```
Widget User Input
  → fetch POST /api/search
    → Backend validates query
    → Backend gets JWT token
    → Backend calls Apex ProductSearchApi
    → Apex queries: Product2 → PricebookEntry → ProductMedia
    → Response returns to Backend
    → Backend transforms and returns to Widget
    → Widget renders product cards
```

### Add to Cart Flow
```
Widget "Add to Cart" Click
  → fetch POST /api/cart/add
    → Backend validates inputs
    → Backend gets JWT token
    → Backend calls Apex CartApi
    → Apex creates/retrieves cart
    → Apex adds item to cart
    → Response returns to Backend
    → Backend returns success/error
    → Widget shows confirmation message
```

---

## 🛡️ Security Checklist

- ✅ No credentials in source code
- ✅ JWT signed with RS256
- ✅ OAuth Bearer tokens only
- ✅ Input validation on all endpoints
- ✅ Environment variables for all secrets
- ✅ .env.local in .gitignore
- ✅ Error messages don't leak sensitive info
- ✅ No Salesforce tokens in browser

---

## 📱 Widget Features

### Product Search
- User enters search term
- Real-time API call to backend
- Loading state while fetching
- Error handling with messages
- Results displayed as cards

### Product Cards
- **Image**: From Salesforce ProductMedia
- **Name**: Product name from Product2
- **SKU**: Stock Keeping Unit
- **Price**: From Standard Pricebook
- **View Details**: Shows inline
- **Add to Cart**: Calls API

### Cart Operations
- Add product to cart
- Quantity validation
- Success/error feedback
- Cart managed server-side
- No client-side cart state

---

## 🚀 Deployment Sequence

1. Deploy Apex classes to Salesforce org
2. Create .env.local from template
3. Fill in Salesforce credentials
4. Test backend locally (npm run dev)
5. Build Next.js (npm run build)
6. Deploy backend to hosting
7. Create Salesforce LWC component
8. Deploy LWC to Salesforce org
9. Add LWC to page in App Builder
10. Test widget in Salesforce page

---

## 🧪 Testing Commands

### Test Search API
```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "laptop"}'
```

### Test Cart API
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

## 📋 Checklist Before Deployment

**Salesforce Setup:**
- [ ] Connected App created with OAuth
- [ ] Private key generated
- [ ] Integration User created
- [ ] ProductSearchApi deployed
- [ ] CartApi deployed
- [ ] Product2 records exist and active
- [ ] PricebookEntry records exist (Standard Pricebook)
- [ ] ProductMedia records exist (optional)

**Next.js Setup:**
- [ ] .env.local created and filled
- [ ] All 5 environment variables configured
- [ ] npm run dev works without errors
- [ ] /api/search endpoint responds
- [ ] /api/cart/add endpoint responds
- [ ] chat-widget.js updated with real API calls

**Deployment:**
- [ ] Backend deployed to hosting
- [ ] Environment variables set in production
- [ ] HTTPS enabled
- [ ] LWC component created
- [ ] LWC deployed to Salesforce
- [ ] Widget script URL updated in LWC
- [ ] Tested in Salesforce page

---

## 🐛 Troubleshooting Quick Links

| Issue | See Guide |
|-------|-----------|
| Environment variables not found | ENVIRONMENT_SETUP.md#missing |
| OAuth token exchange failed | ENVIRONMENT_SETUP.md#oauth |
| Products not showing | ENVIRONMENT_SETUP.md#products |
| Add to cart not working | DEPLOYMENT_CHECKLIST.md#cart |
| API response format | API_CONTRACTS.md |
| Step-by-step deployment | DEPLOYMENT_CHECKLIST.md |

---

## 📞 Key Contact Points

**For Salesforce Issues:**
- Check ProductSearchApi.cls / CartApi.cls
- Verify Integration User has API access
- Check org setup for Commerce APIs

**For Backend Issues:**
- Check .env.local is configured
- Review salesforceAuth.ts JWT logic
- Check /api/search and /api/cart/add routes

**For Widget Issues:**
- Check chat-widget.js for API calls
- Use browser DevTools Network tab
- Verify /api/search response format

---

## 💾 Backup Credentials

Keep secure backup of:
- [ ] Client ID
- [ ] Private Key (PEM format)
- [ ] Integration User credentials
- [ ] Salesforce instance URL

⚠️ **DO NOT** commit these to Git!

---

## 📈 What's Next After Deployment

1. Monitor API response times
2. Track product search queries
3. Monitor cart additions
4. Gather user feedback
5. Add analytics (optional)
6. Optimize product queries
7. Scale widget to other pages

---

## 🎉 You're All Set!

The chat widget implementation is complete and ready for deployment. Follow DEPLOYMENT_CHECKLIST.md for step-by-step instructions.

All code:
- ✅ Follows specifications
- ✅ Maintains architecture
- ✅ Enforces security rules
- ✅ Includes error handling
- ✅ Well documented

**Happy deploying!**
