(function() {
    // Check if widget already exists
    if (document.getElementById('nextjs-chat-button')) {
        return;
    }

    const chatButton = document.createElement('button');
    chatButton.id = 'nextjs-chat-button';
    chatButton.innerText = '💬';
    chatButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 999999;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background-color: #0070f3;
        color: white;
        border: none;
        cursor: pointer;
        font-size: 24px;
        box-shadow: 0 4px 12px rgba(0, 112, 243, 0.4);
        transition: all 0.3s ease;
    `;

    chatButton.onmouseover = () => {
        chatButton.style.transform = 'scale(1.1)';
        chatButton.style.boxShadow = '0 6px 16px rgba(0, 112, 243, 0.6)';
    };

    chatButton.onmouseout = () => {
        chatButton.style.transform = 'scale(1)';
        chatButton.style.boxShadow = '0 4px 12px rgba(0, 112, 243, 0.4)';
    };

    document.body.appendChild(chatButton);

    const chatWindow = document.createElement('div');
    chatWindow.id = 'nextjs-chat-window';
    chatWindow.style.cssText = `
        position: fixed;
        bottom: 90px;
        right: 20px;
        width: 350px;
        height: 500px;
        z-index: 999999;
        background-color: white;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        display: none;
        flex-direction: column;
        box-shadow: 0 5px 40px rgba(0, 0, 0, 0.16);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Header with close button
    const header = document.createElement('div');
    header.style.cssText = `
        background-color: #0070f3;
        color: white;
        padding: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-radius: 8px 8px 0 0;
    `;
    
    const title = document.createElement('h3');
    title.style.cssText = 'margin: 0; font-size: 16px;';
    title.textContent = 'Product Search Chat';
    
    const closeBtn = document.createElement('button');
    closeBtn.id = 'close-chat';
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        margin: 0;
    `;
    
    // Attach close button event listener IMMEDIATELY
    closeBtn.onclick = (e) => {
        e.stopPropagation();
        chatWindow.style.display = 'none';
    };
    
    header.appendChild(title);
    header.appendChild(closeBtn);

    // Messages container
    const messagesContainer = document.createElement('div');
    messagesContainer.id = 'nextjs-chat-messages';
    messagesContainer.style.cssText = `
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;
    `;
    const welcomeMsg = document.createElement('div');
    welcomeMsg.style.cssText = `
        padding: 8px 12px;
        background-color: #e9ecef;
        color: #333;
        border-radius: 6px;
        font-size: 14px;
    `;
    welcomeMsg.innerHTML = '👋 Hello! How can I help you find a product?';
    messagesContainer.appendChild(welcomeMsg);

    // Input container
    const inputContainer = document.createElement('div');
    inputContainer.style.cssText = `
        display: flex;
        gap: 8px;
        padding: 12px;
        border-top: 1px solid #e9ecef;
    `;

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Search for products...';
    input.style.cssText = `
        flex: 1;
        padding: 8px 12px;
        border: 1px solid #e9ecef;
        border-radius: 4px;
        font-size: 14px;
    `;

    const sendBtn = document.createElement('button');
    sendBtn.innerText = 'Send';
    sendBtn.style.cssText = `
        padding: 8px 16px;
        background-color: #0070f3;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
    `;

    sendBtn.onclick = async () => {
        const message = input.value.trim();
        if (message) {
            // Add user message
            const userMsg = document.createElement('div');
            userMsg.style.cssText = `
                align-self: flex-end;
                background-color: #0070f3;
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                max-width: 80%;
                word-wrap: break-word;
                font-size: 14px;
            `;
            userMsg.textContent = message;
            messagesContainer.appendChild(userMsg);

            // Show loading state
            const loadingMsg = document.createElement('div');
            loadingMsg.style.cssText = `
                align-self: flex-start;
                background-color: #e9ecef;
                color: #333;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 14px;
            `;
            loadingMsg.textContent = 'Searching products...';
            messagesContainer.appendChild(loadingMsg);
            input.value = '';
            messagesContainer.scrollTop = messagesContainer.scrollHeight;

            try {
                // Call backend search API
                const searchResponse = await fetch('/api/search', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ query: message }),
                });

                // Remove loading message
                messagesContainer.removeChild(loadingMsg);

                if (!searchResponse.ok) {
                    const errorData = await searchResponse.json();
                    const errorMsg = document.createElement('div');
                    errorMsg.style.cssText = `
                        align-self: flex-start;
                        background-color: #e9ecef;
                        color: #333;
                        padding: 8px 12px;
                        border-radius: 6px;
                        max-width: 80%;
                        word-wrap: break-word;
                        font-size: 14px;
                    `;
                    errorMsg.textContent = errorData.error || 'Search failed. Please try again.';
                    messagesContainer.appendChild(errorMsg);
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    return;
                }

                const data = await searchResponse.json();

                // Add bot response message
                const botMsg = document.createElement('div');
                botMsg.style.cssText = `
                    align-self: flex-start;
                    background-color: #e9ecef;
                    color: #333;
                    padding: 8px 12px;
                    border-radius: 6px;
                    max-width: 80%;
                    word-wrap: break-word;
                    font-size: 14px;
                `;
                botMsg.textContent = data.message || 'Products found!';
                messagesContainer.appendChild(botMsg);

                // Render product cards
                if (data.products && data.products.length > 0) {
                    data.products.forEach(product => {
                        renderProductCard(product, messagesContainer);
                    });
                } else {
                    const noResultsMsg = document.createElement('div');
                    noResultsMsg.style.cssText = `
                        align-self: flex-start;
                        background-color: #e9ecef;
                        color: #333;
                        padding: 8px 12px;
                        border-radius: 6px;
                        font-size: 14px;
                    `;
                    noResultsMsg.textContent = 'No products found matching your search.';
                    messagesContainer.appendChild(noResultsMsg);
                }

                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            } catch (error) {
                // Remove loading message
                messagesContainer.removeChild(loadingMsg);

                const errorMsg = document.createElement('div');
                errorMsg.style.cssText = `
                    align-self: flex-start;
                    background-color: #e9ecef;
                    color: #333;
                    padding: 8px 12px;
                    border-radius: 6px;
                    max-width: 80%;
                    word-wrap: break-word;
                    font-size: 14px;
                `;
                errorMsg.textContent = 'Error searching products. Please try again.';
                messagesContainer.appendChild(errorMsg);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }
    };

    inputContainer.appendChild(input);
    inputContainer.appendChild(sendBtn);

    chatWindow.appendChild(header);
    chatWindow.appendChild(messagesContainer);
    chatWindow.appendChild(inputContainer);

    document.body.appendChild(chatWindow);

    // Product Card Rendering Function
    function renderProductCard(product, container) {
        const card = document.createElement('div');
        card.style.cssText = `
            align-self: flex-start;
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            padding: 12px;
            max-width: 250px;
            font-size: 13px;
            margin: 4px 0;
        `;

        // Image
        const img = document.createElement('img');
        img.src = product.imageUrl || '/placeholder.png';
        img.alt = product.name;
        img.style.cssText = `
            width: 100%;
            height: 150px;
            object-fit: cover;
            border-radius: 4px;
            margin-bottom: 8px;
        `;
        card.appendChild(img);

        // Product name
        const nameEl = document.createElement('div');
        nameEl.style.cssText = `
            font-weight: bold;
            margin-bottom: 4px;
            color: #333;
        `;
        nameEl.textContent = product.name;
        card.appendChild(nameEl);

        // SKU
        const skuEl = document.createElement('div');
        skuEl.style.cssText = `
            color: #666;
            font-size: 12px;
            margin-bottom: 4px;
        `;
        skuEl.textContent = `SKU: ${product.sku}`;
        card.appendChild(skuEl);

        // Price
        const priceEl = document.createElement('div');
        priceEl.style.cssText = `
            color: #0070f3;
            font-weight: bold;
            margin-bottom: 8px;
            font-size: 14px;
        `;
        priceEl.textContent = `$${parseFloat(product.price).toFixed(2)}`;
        card.appendChild(priceEl);

        // Button container
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            gap: 6px;
        `;

        // View Details button
        const detailsBtn = document.createElement('button');
        detailsBtn.textContent = 'View Details';
        detailsBtn.style.cssText = `
            flex: 1;
            padding: 6px 8px;
            background-color: #e9ecef;
            color: #333;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        `;
        detailsBtn.onmouseover = () => {
            detailsBtn.style.backgroundColor = '#dee2e6';
        };
        detailsBtn.onmouseout = () => {
            detailsBtn.style.backgroundColor = '#e9ecef';
        };
        detailsBtn.onclick = () => {
            const detailsMsg = document.createElement('div');
            detailsMsg.style.cssText = `
                align-self: flex-start;
                background-color: #e9ecef;
                color: #333;
                padding: 8px 12px;
                border-radius: 6px;
                max-width: 80%;
                word-wrap: break-word;
                font-size: 14px;
            `;
            detailsMsg.textContent = `Product: ${product.name} | SKU: ${product.sku} | Price: $${parseFloat(product.price).toFixed(2)}`;
            messagesContainer.appendChild(detailsMsg);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        };
        buttonContainer.appendChild(detailsBtn);

        // Add to Cart button
        const cartBtn = document.createElement('button');
        cartBtn.textContent = 'Add to Cart';
        cartBtn.style.cssText = `
            flex: 1;
            padding: 6px 8px;
            background-color: #0070f3;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        `;
        cartBtn.onmouseover = () => {
            cartBtn.style.backgroundColor = '#0057cc';
        };
        cartBtn.onmouseout = () => {
            cartBtn.style.backgroundColor = '#0070f3';
        };
        cartBtn.onclick = async () => {
            cartBtn.disabled = true;
            cartBtn.textContent = 'Adding...';

            try {
                const cartResponse = await fetch('/api/cart/add', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        productId: product.id,
                        quantity: 1,
                        sku: product.sku,
                    }),
                });

                const cartData = await cartResponse.json();

                if (!cartResponse.ok) {
                    const errorMsg = document.createElement('div');
                    errorMsg.style.cssText = `
                        align-self: flex-start;
                        background-color: #f8d7da;
                        color: #721c24;
                        padding: 8px 12px;
                        border-radius: 6px;
                        border: 1px solid #f5c6cb;
                        max-width: 80%;
                        word-wrap: break-word;
                        font-size: 14px;
                    `;
                    errorMsg.textContent = cartData.error || 'Failed to add item to cart.';
                    messagesContainer.appendChild(errorMsg);
                } else {
                    const successMsg = document.createElement('div');
                    successMsg.style.cssText = `
                        align-self: flex-start;
                        background-color: #d4edda;
                        color: #155724;
                        padding: 8px 12px;
                        border-radius: 6px;
                        border: 1px solid #c3e6cb;
                        max-width: 80%;
                        word-wrap: break-word;
                        font-size: 14px;
                    `;
                    successMsg.textContent = `✓ ${product.name} added to cart!`;
                    messagesContainer.appendChild(successMsg);
                }

                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            } catch (error) {
                const errorMsg = document.createElement('div');
                errorMsg.style.cssText = `
                    align-self: flex-start;
                    background-color: #f8d7da;
                    color: #721c24;
                    padding: 8px 12px;
                    border-radius: 6px;
                    border: 1px solid #f5c6cb;
                    max-width: 80%;
                    word-wrap: break-word;
                    font-size: 14px;
                `;
                errorMsg.textContent = 'Error adding item to cart. Please try again.';
                messagesContainer.appendChild(errorMsg);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            } finally {
                cartBtn.disabled = false;
                cartBtn.textContent = 'Add to Cart';
            }
        };
        buttonContainer.appendChild(cartBtn);

        card.appendChild(buttonContainer);
        container.appendChild(card);
    }

    // Toggle chat window
    chatButton.onclick = () => {
        chatWindow.style.display = chatWindow.style.display === 'none' ? 'flex' : 'none';
    };
})();