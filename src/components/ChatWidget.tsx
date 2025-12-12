import React, { useState } from 'react';
import ChatButton from './ChatButton';
import ChatWindow from './ChatWindow';
import useChat from '@/hooks/useChat';

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { messages, input, loading, handleInputChange, handleSubmit, clearMessages } = useChat();

    const toggleChat = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            clearMessages();
        }
    };

    return (
        <>
            <ChatButton onClick={toggleChat} />
            {isOpen && (
                <ChatWindow
                    messages={messages}
                    input={input}
                    loading={loading}
                    onInputChange={handleInputChange}
                    onSubmit={handleSubmit}
                    onClose={toggleChat}
                />
            )}
        </>
    );
};

export default ChatWidget;