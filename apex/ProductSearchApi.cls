/**
 * ProductSearchApi
 * Apex REST API for searching products
 * Queries Product2, PricebookEntry, and ProductMedia separately
 * Returns search results to the Next.js backend
 */
@RestResource(urlMapping='/services/apexrest/ProductSearchApi/*')
global class ProductSearchApi {
    
    /**
     * Search for products by query string
     * @param query Search string to match against product names
     * @return JSON response with product details
     */
    @HttpPost
    global static SearchResponse searchProducts(String query) {
        SearchResponse response = new SearchResponse();
        
        try {
            // Validate input
            if (String.isBlank(query)) {
                response.success = false;
                response.message = 'Search query cannot be empty';
                return response;
            }
            
            // Step 1: Query Product2 records matching search term (LIMIT 10)
            String searchTerm = '%' + query + '%';
            List<Product2> products = [
                SELECT Id, Name, StockKeepingUnit, Family
                FROM Product2
                WHERE IsActive = true
                AND Name LIKE :searchTerm
                LIMIT 10
            ];
            
            if (products.isEmpty()) {
                response.success = true;
                response.products = new List<ProductResult>();
                response.message = 'No products found matching your search';
                return response;
            }
            
            // Step 2: Collect Product2 IDs for next queries
            Set<Id> productIds = new Set<Id>();
            for (Product2 product : products) {
                productIds.add(product.Id);
            }
            
            // Step 3: Query PricebookEntry separately (using Maps to avoid nested loops)
            Map<Id, PricebookEntry> priceMap = new Map<Id, PricebookEntry>();
            List<PricebookEntry> prices = [
                SELECT Id, Product2Id, UnitPrice, IsActive
                FROM PricebookEntry
                WHERE Product2Id IN :productIds
                AND IsActive = true
                AND Pricebook2.IsStandard = true
            ];
            
            for (PricebookEntry price : prices) {
                priceMap.put(price.Product2Id, price);
            }
            
            // Step 4: Query ProductMedia separately (using Maps to avoid nested loops)
            Map<Id, ProductMedia> mediaMap = new Map<Id, ProductMedia>();
            List<ProductMedia> mediaList = [
                SELECT Id, Product2Id, MediaProvider, SourceUrl, Title
                FROM ProductMedia
                WHERE Product2Id IN :productIds
                LIMIT 10
            ];
            
            for (ProductMedia media : mediaList) {
                if (!mediaMap.containsKey(media.Product2Id)) {
                    mediaMap.put(media.Product2Id, media);
                }
            }
            
            // Step 5: Build response using Maps (no nested loops)
            List<ProductResult> results = new List<ProductResult>();
            for (Product2 product : products) {
                ProductResult result = new ProductResult();
                result.id = product.Id;
                result.name = product.Name;
                result.sku = product.StockKeepingUnit;
                
                // Get price from Map
                if (priceMap.containsKey(product.Id)) {
                    result.price = priceMap.get(product.Id).UnitPrice;
                } else {
                    result.price = 0;
                }
                
                // Get image from Map
                if (mediaMap.containsKey(product.Id)) {
                    result.image = mediaMap.get(product.Id).SourceUrl;
                } else {
                    result.image = null;
                }
                
                results.add(result);
            }
            
            response.success = true;
            response.products = results;
            response.message = 'Products found successfully';
            
        } catch (Exception e) {
            response.success = false;
            response.message = 'Error searching products: ' + e.getMessage();
        }
        
        return response;
    }
    
    /**
     * Response wrapper for product search
     */
    global class SearchResponse {
        public Boolean success { get; set; }
        public String message { get; set; }
        public List<ProductResult> products { get; set; }
        
        public SearchResponse() {
            this.products = new List<ProductResult>();
        }
    }
    
    /**
     * Product result object
     */
    global class ProductResult {
        public String id { get; set; }
        public String name { get; set; }
        public String sku { get; set; }
        public Decimal price { get; set; }
        public String image { get; set; }
    }
}
