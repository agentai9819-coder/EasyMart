@RestResource(urlMapping='/CartApi/*')
global with sharing class CartApi {

    @HttpPost
    global static AddToCartResponse addToCart() {

        RestResponse httpRes = RestContext.response;
        AddToCartResponse response = new AddToCartResponse();

        try {
            // -------------------------------------------------
            // 1. Parse request
            // -------------------------------------------------
            if (RestContext.request == null || RestContext.request.requestBody == null) {
                return error(response, httpRes, 400, 'Request body is required');
            }

            AddToCartRequest req =
                (AddToCartRequest) JSON.deserialize(
                    RestContext.request.requestBody.toString(),
                    AddToCartRequest.class
                );

            if (String.isBlank(req.productId)) {
                return error(response, httpRes, 400, 'productId is required');
            }
            if (req.quantity == null || req.quantity <= 0) {
                return error(response, httpRes, 400, 'quantity must be greater than zero');
            }

            // -------------------------------------------------
            // 2. Resolve active Web Store (SERVER SIDE)
            // -------------------------------------------------
            Id webStoreId = [
                SELECT Id
                FROM WebStore
                WHERE Name = 'FantasticEcomm'
                LIMIT 1
            ].Id;

            // -------------------------------------------------
            // 3. Resolve Buyer Account (SERVER SIDE)
            // MVP: first active Buyer Account -> use the related Account Id
            // -------------------------------------------------
            Id buyerAccountId = [
                SELECT AccountId
                FROM BuyerAccount
                WHERE IsActive = true
                LIMIT 1
            ].AccountId;

            if (buyerAccountId == null) {
                return error(response, httpRes, 400, 'No buyer AccountId found on BuyerAccount record');
            }

            // -------------------------------------------------
            // 4. Get or create ACTIVE cart
            // -------------------------------------------------
            ConnectApi.CartSummary summary =
                ConnectApi.CommerceCart.getOrCreateActiveCartSummary(
                        webStoreId,
                        buyerAccountId,
                        'active'
                    );

            // -------------------------------------------------
            // 5. Load real WebCart (SOURCE OF TRUTH)
            // -------------------------------------------------
            WebCart cart = [
                SELECT Id, AccountId
                FROM WebCart
                WHERE Id = :summary.cartId
                LIMIT 1
            ];

            // -------------------------------------------------
            // 6. Add item to cart (CORRECT SIGNATURE)
            // -------------------------------------------------
            ConnectApi.CartItemInput input = new ConnectApi.CartItemInput();
            input.productId = req.productId;
            input.quantity  = String.valueOf(req.quantity);
            input.type      = ConnectApi.CartItemType.Product;

            ConnectApi.CommerceCart.addItemToCart(
                webStoreId,
                cart.AccountId,
                cart.Id,
                input,
                UserInfo.getDefaultCurrency()
            );

            // -------------------------------------------------
            // 7. Success response
            // -------------------------------------------------
            response.success = true;
            response.cartId  = cart.Id;
            response.message = 'Item added to cart successfully';
            httpRes.statusCode = 200;

        } catch (Exception e) {
            response.success = false;
            response.message = e.getMessage();
            httpRes.statusCode = 500;
        }

        return response;
    }

    // -------------------------------------------------
    // Helpers & DTOs
    // -------------------------------------------------
    private static AddToCartResponse error(
        AddToCartResponse r,
        RestResponse res,
        Integer status,
        String msg
    ) {
        r.success = false;
        r.message = msg;
        res.statusCode = status;
        return r;
    }

    global class AddToCartRequest {
        public String productId;
        public Integer quantity;
    }

    global class AddToCartResponse {
        public Boolean success;
        public String message;
        public Id cartId;
    }
}