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

    sendBtn.onclick = () => {
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

            // Simulate bot response
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
            botMsg.textContent = 'Thanks for your message! A support agent will respond soon.';
            messagesContainer.appendChild(botMsg);

            input.value = '';
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    };

    inputContainer.appendChild(input);
    inputContainer.appendChild(sendBtn);

    chatWindow.appendChild(header);
    chatWindow.appendChild(messagesContainer);
    chatWindow.appendChild(inputContainer);

    document.body.appendChild(chatWindow);

    // Toggle chat window
    chatButton.onclick = () => {
        chatWindow.style.display = chatWindow.style.display === 'none' ? 'flex' : 'none';
    };
})();