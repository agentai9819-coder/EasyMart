import { useState, useCallback } from 'react';
import { ChatMessage } from '@/types';

interface UseChatReturn {
    messages: ChatMessage[];
    input: string;
    loading: boolean;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleSubmit: (e: React.FormEvent) => void;
    clearMessages: () => void;
}

const useChat = (): UseChatReturn => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const sendMessage = useCallback(async (message: string) => {
        setLoading(true);
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }),
            });
            const data = await response.json();
            
            const userMessage: ChatMessage = {
                id: Date.now().toString(),
                sender: 'user',
                content: message,
                timestamp: new Date(),
            };
            const botMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                sender: 'bot',
                content: data.reply,
                timestamp: new Date(),
            };
            
            setMessages((prev) => [...prev, userMessage, botMessage]);
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            sendMessage(input);
            setInput('');
        }
    };

    const clearMessages = () => {
        setMessages([]);
    };

    return {
        messages,
        input,
        loading,
        handleInputChange,
        handleSubmit,
        clearMessages,
    };
};

export default useChat;