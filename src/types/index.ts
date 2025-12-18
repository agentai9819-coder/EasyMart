export interface ChatMessage {
    id: string;
    sender: 'user' | 'bot';
    content: string;
    // Optional structured products returned by bot messages
    products?: Product[];
    timestamp: Date;
}

export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    category: string;
}

export interface ChatResponse {
    reply: string;
    products?: Product[];
}