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
        const script = document.createElement('script');
        script.id = 'nextjs-chat-widget-script';
        // Cache-bust the script URL so Experience Site loads latest bundle after deploys
        const ver = Date.now();
        script.src = `https://chat-widget-sage.vercel.app/chat-widget.js?v=${ver}`;
        script.async = true;
        
        script.onload = () => {
            console.log('✓ Chat widget loaded successfully (v=' + ver + ')');
        };
        
        script.onerror = () => {
            console.error('✗ Failed to load chat widget');
        };

        document.body.appendChild(script);
    }
}