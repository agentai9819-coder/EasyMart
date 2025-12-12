import React from 'react';

interface ChatButtonProps {
    onClick: () => void;
}

const ChatButton: React.FC<ChatButtonProps> = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            title="Open chat widget"
            className="chat-button"
            style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                zIndex: 999,
                backgroundColor: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '60px',
                height: '60px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0, 112, 243, 0.4)',
                fontSize: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 16px rgba(0, 112, 243, 0.6)';
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(0, 112, 243, 0.4)';
            }}
        >
            💬
        </button>
    );
};

export default ChatButton;