(function () {
    // Check if widget already exists
    console.log('[CHAT WIDGET] script execution start');
    if (document.getElementById('nextjs-chat-button')) {
        return;
    }

    const chatButton = document.createElement('button');
    const API_BASE = 'https://chat-widget-sage.vercel.app';
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
    console.log('[CHAT WIDGET] appended chat button to DOM');

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
    // Simple in-memory cart for the injected widget (productId -> { quantity, cartItemId })
    const cartState = {};

    // Debug overlay (visible on the page) to help diagnose embed issues — shows cartState and frame info
    (function createDebugOverlay() {
        try {
            const overlay = document.createElement('div');
            overlay.id = 'cw-debug-overlay';
            overlay.style.cssText = `
                position: fixed;
                left: 8px;
                bottom: 8px;
                max-width: 320px;
                max-height: 240px;
                overflow: auto;
                background: rgba(0,0,0,0.7);
                color: #fff;
                font-size: 12px;
                padding: 8px;
                border-radius: 6px;
                z-index: 2147483647;
                line-height: 1.2;
            `;

            const title = document.createElement('div');
            title.textContent = 'Chat Widget Debug';
            title.style.cssText = 'font-weight:700;margin-bottom:6px;font-size:12px;';
            overlay.appendChild(title);

            const info = document.createElement('pre');
            info.id = 'cw-debug-info';
            info.style.cssText = 'white-space:pre-wrap;word-break:break-word;margin:0;padding:0;';
            overlay.appendChild(info);

            const closeBtn = document.createElement('button');
            closeBtn.textContent = '×';
            closeBtn.style.cssText = `
                position: absolute;right:6px;top:4px;background:transparent;border:none;color:#fff;font-size:14px;cursor:pointer;
            `;
            closeBtn.onclick = () => overlay.remove();
            overlay.appendChild(closeBtn);

            document.body.appendChild(overlay);

            function updateDebug() {
                const isTop = (() => {
                    try { return window.top === window.self; } catch (e) { return 'cross-origin'; }
                })();
                const lines = [];
                lines.push('frameTop:' + String(isTop));
                lines.push('origin:' + (typeof window !== 'undefined' ? window.location.origin : 'n/a'));
                try {
                    lines.push('cartState:' + JSON.stringify(cartState));
                } catch (e) {
                    lines.push('cartState: [unserializable]');
                }
                const scripts = Array.from(document.querySelectorAll('script[src]')).map(s => s.src).filter(Boolean);
                const found = scripts.find(s => s.includes('chat-widget.js')) || '';
                lines.push('script:' + found);
                info.textContent = lines.join('\n');
            }

            updateDebug();
            const iv = setInterval(updateDebug, 1000);
            // remove interval if overlay removed
            const obs = new MutationObserver(() => { if (!document.body.contains(overlay)) { clearInterval(iv); obs.disconnect(); } });
            obs.observe(document.body, { childList: true, subtree: true });
        } catch (err) {
            console.warn('cw-debug-overlay failed', err);
        }
    })();

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
                // Call backend search API  // await fetch('/api/search', removed from line 185
                const searchResponse = await fetch(`${API_BASE}/api/search`, {
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

                //const data = await searchResponse.json();
                const text = await searchResponse.text();

                if (!searchResponse.ok) {
                    throw new Error(`Search failed (${searchResponse.status}): ${text}`);
                }

                //CRITICAL SAFETY CHECK
                if (!searchResponse.headers.get('content-type')?.includes('application/json')) {
                    throw new Error('Non-JSON response from search API: ' + text.slice(0, 100));
                }

                const data = JSON.parse(text);

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

    // Product Card Rendering Function — keeps Add button visible and shows quantity controls when item is in cartState
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
            align-items: center;
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
        detailsBtn.onmouseover = () => (detailsBtn.style.backgroundColor = '#dee2e6');
        detailsBtn.onmouseout = () => (detailsBtn.style.backgroundColor = '#e9ecef');
        detailsBtn.onclick = () => {
            console.log('[CHAT WIDGET] View Details clicked for', product.id);
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

        // Controls wrapper — contains Add button and, when applicable, quantity controls
        const controlsWrapper = document.createElement('div');
        controlsWrapper.style.cssText = `display:flex;gap:6px;align-items:center;`;

        // Add button (always visible)
        const addBtn = document.createElement('button');
        addBtn.textContent = 'Add to Cart';
        addBtn.style.cssText = `
            padding: 6px 8px;
            background-color: #0070f3;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        `;
        addBtn.onmouseover = () => (addBtn.style.backgroundColor = '#0057cc');
        addBtn.onmouseout = () => (addBtn.style.backgroundColor = '#0070f3');
        addBtn.onclick = async () => {
            console.log('[CHAT WIDGET] Add button clicked for', product.id);
            // If item already in cart, treat as increase by 1
            if (cartState[product.id]) {
                // call update
                const current = cartState[product.id];
                const newQty = (current.quantity || 0) + 1;
                try {
                    const resp = await fetch(`${API_BASE}/api/cart/update`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ cartItemId: current.cartItemId, quantity: newQty }),
                    });
                    const data = await resp.json();
                    if (resp.ok) {
                        cartState[product.id].quantity = newQty;
                        // update qty display if present
                        const qtySpan = controlsWrapper.querySelector('.cw-qty');
                        if (qtySpan) qtySpan.textContent = String(newQty);
                        console.log('[CHAT WIDGET] increased quantity to', newQty);
                    } else {
                        console.error('[CHAT WIDGET] increase failed', data);
                    }
                } catch (err) {
                    console.error('[CHAT WIDGET] increase error', err);
                }
            } else {
                // create
                addBtn.disabled = true;
                addBtn.textContent = 'Adding...';
                try {
                    const cartResponse = await fetch(`${API_BASE}/api/cart/add`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ productId: product.id, quantity: 1, sku: product.sku }),
                    });
                    const cartData = await cartResponse.json();
                    if (!cartResponse.ok) {
                        console.error('[CHAT WIDGET] add failed', cartData);
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
                        const cartItemId = cartData.cartItemId || '';
                        cartState[product.id] = { quantity: 1, cartItemId };
                        console.log('[CHAT WIDGET] added to cart', product.id, cartItemId);
                        renderQuantityControls();
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
                } catch (err) {
                    console.error('[CHAT WIDGET] add error', err);
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
                } finally {
                    addBtn.disabled = false;
                    addBtn.textContent = 'Add to Cart';
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }
            }
        };
        controlsWrapper.appendChild(addBtn);

        // Quantity controls (rendered when item exists in cartState)
        function renderQuantityControls() {
            // remove existing qty container
            const existing = controlsWrapper.querySelector('.cw-qty-wrap');
            if (existing) existing.remove();
            const state = cartState[product.id];
            if (!state) return;

            const qtyWrap = document.createElement('div');
            qtyWrap.className = 'cw-qty-wrap';
            qtyWrap.style.cssText = 'display:flex;gap:6px;align-items:center;';

            const decBtn = document.createElement('button');
            decBtn.textContent = '−';
            decBtn.style.cssText = 'padding:6px 8px;border-radius:4px;font-size:12px;';
            decBtn.onclick = async () => {
                const newQty = Math.max(0, (cartState[product.id].quantity || 1) - 1);
                if (newQty === 0) {
                    try {
                        const resp = await fetch(`${API_BASE}/api/cart/remove`, {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ cartItemId: state.cartItemId }),
                        });
                        const data = await resp.json();
                        if (resp.ok) {
                            delete cartState[product.id];
                            renderQuantityControls();
                            try { addBtn.textContent = 'Add to Cart'; } catch (e) {}
                            console.log('[CHAT WIDGET] removed', product.id);
                        } else {
                            console.error('[CHAT WIDGET] remove failed', data);
                        }
                    } catch (err) {
                        console.error('[CHAT WIDGET] remove error', err);
                    }
                } else {
                    try {
                        const resp = await fetch(`${API_BASE}/api/cart/update`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ cartItemId: state.cartItemId, quantity: newQty }),
                        });
                        const data = await resp.json();
                        if (resp.ok) {
                            cartState[product.id].quantity = newQty;
                            const qtySpan = controlsWrapper.querySelector('.cw-qty');
                            if (qtySpan) qtySpan.textContent = String(newQty);
                            try { addBtn.textContent = `Add (${newQty})`; } catch (e) {}
                            console.log('[CHAT WIDGET] decreased to', newQty);
                        } else {
                            console.error('[CHAT WIDGET] decrease failed', data);
                        }
                    } catch (err) {
                        console.error('[CHAT WIDGET] decrease error', err);
                    }
                }
            };

            const qtySpan = document.createElement('span');
            qtySpan.className = 'cw-qty';
            qtySpan.textContent = String(state.quantity || 1);
            qtySpan.style.cssText = 'padding:6px 8px;min-width:28px;text-align:center;border-radius:4px;background:#fff;border:1px solid #ddd;font-size:12px;';

            const incBtn = document.createElement('button');
            incBtn.textContent = '+';
            incBtn.style.cssText = 'padding:6px 8px;border-radius:4px;font-size:12px;';
            incBtn.onclick = async () => {
                const newQty = (cartState[product.id].quantity || 0) + 1;
                try {
                    const resp = await fetch(`${API_BASE}/api/cart/update`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ cartItemId: state.cartItemId, quantity: newQty }),
                    });
                    const data = await resp.json();
                    if (resp.ok) {
                        cartState[product.id].quantity = newQty;
                        qtySpan.textContent = String(newQty);
                        try { addBtn.textContent = `Add (${newQty})`; } catch (e) {}
                        console.log('[CHAT WIDGET] increased to', newQty);
                    } else {
                        console.error('[CHAT WIDGET] increase failed', data);
                    }
                } catch (err) {
                    console.error('[CHAT WIDGET] increase error', err);
                }
            };

            const delBtn = document.createElement('button');
            delBtn.textContent = '🗑️';
            delBtn.style.cssText = 'padding:6px 8px;border-radius:4px;font-size:12px;background:#ffebee;color:#c41c3b;border:1px solid #ffcdd2;';
            delBtn.onclick = async () => {
                try {
                    const resp = await fetch(`${API_BASE}/api/cart/remove`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ cartItemId: state.cartItemId }),
                    });
                    const data = await resp.json();
                    if (resp.ok) {
                        delete cartState[product.id];
                        renderQuantityControls();
                        try { addBtn.textContent = 'Add to Cart'; } catch (e) {}
                        console.log('[CHAT WIDGET] deleted', product.id);
                    } else {
                        console.error('[CHAT WIDGET] delete failed', data);
                    }
                } catch (err) {
                    console.error('[CHAT WIDGET] delete error', err);
                }
            };

            qtyWrap.appendChild(decBtn);
            qtyWrap.appendChild(qtySpan);
            qtyWrap.appendChild(incBtn);
            qtyWrap.appendChild(delBtn);
            controlsWrapper.appendChild(qtyWrap);
        }

        // initial render: always show Add; also show qty if present
        buttonContainer.appendChild(controlsWrapper);
        card.appendChild(buttonContainer);
        container.appendChild(card);
        // attach add button and qty controls after DOM insertion
        controlsWrapper.appendChild(addBtn);
        if (cartState[product.id]) renderQuantityControls();
    }

    // Toggle chat window
    chatButton.onclick = () => {
        chatWindow.style.display = chatWindow.style.display === 'none' ? 'flex' : 'none';
    };
})();