import { LightningElement } from 'lwc';

export default class ChatWidgetEmbed extends LightningElement {
    connectedCallback() {
        this.loadChatWidgetScript();
    }

    loadChatWidgetScript() {
        // Check if script already loaded
        if (document.getElementById('nextjs-chat-widget-script')) {
            return;
        }
        // Create harmless dummy globals to prevent ReferenceErrors
        // when an older/cached remote script references globals before
        // defining them (Salesforce/Experience site load-order differences).
        try {
            if (!window.inputContainer) {
                window.inputContainer = document.createElement('div');
                window.inputContainer.id = 'nextjs-chat-input-dummy';
                window.inputContainer.style.display = 'none';
                document.body.appendChild(window.inputContainer);
                console.log('ChatWidgetEmbed: created dummy window.inputContainer');
            }
            if (!window.addBtn) {
                window.addBtn = document.createElement('button');
                window.addBtn.id = 'nextjs-chat-addbtn-dummy';
                window.addBtn.style.display = 'none';
                document.body.appendChild(window.addBtn);
                console.log('ChatWidgetEmbed: created dummy window.addBtn');
            }
        } catch (err) {
            console.warn('ChatWidgetEmbed: failed to create dummy globals', err);
        }

        const script = document.createElement('script');
        script.id = 'nextjs-chat-widget-script';
        // Cache-bust the script URL so Experience Site loads latest bundle after deploys
        const ver = Date.now();
        script.src = `https://chat-widget-sage.vercel.app/chat-widget.js?v=${ver}`;
        script.async = true;
        // Log load and clean up dummy globals after successful load.
        script.onload = () => {
            console.log('✓ Chat widget loaded successfully (v=' + ver + ')');
            // Give the injected script a short moment to initialize elements
            // before removing our dummy placeholders.
            setTimeout(() => {
                try {
                    if (window.inputContainer && window.inputContainer.id === 'nextjs-chat-input-dummy') {
                        window.inputContainer.remove();
                        delete window.inputContainer;
                        console.log('ChatWidgetEmbed: removed dummy inputContainer');
                    }
                    if (window.addBtn && window.addBtn.id === 'nextjs-chat-addbtn-dummy') {
                        window.addBtn.remove();
                        delete window.addBtn;
                        console.log('ChatWidgetEmbed: removed dummy addBtn');
                    }
                } catch (err) {
                    console.warn('ChatWidgetEmbed: cleanup failed', err);
                }
            }, 500);
        };

        script.onerror = () => {
            console.error('✗ Failed to load chat widget (v=' + ver + ')');
        };

        document.body.appendChild(script);
    }
}