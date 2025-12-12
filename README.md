# Next.js Chat Widget

This project is a chat widget built with Next.js that facilitates product search. It can be integrated into existing websites, such as Salesforce, to enhance user experience by providing real-time chat support and product discovery.

## Features

- Floating chat button that triggers the chat interface.
- Chat window for user interactions.
- Product search functionality within the chat.
- API route for handling chat-related requests.

## Project Structure

```
nextjs-chat-widget
├── src
│   ├── app
│   │   ├── layout.tsx        # Layout component for the application
│   │   ├── page.tsx          # Main entry point for the application
│   │   └── api
│   │       └── chat
│   │           └── route.ts  # API route for chat interactions
│   ├── components
│   │   ├── ChatWidget.tsx     # Chat interface component
│   │   ├── ChatButton.tsx      # Floating chat button component
│   │   ├── ChatWindow.tsx      # Chat messages and input field
│   │   └── ProductSearch.tsx    # Product search component
│   ├── hooks
│   │   └── useChat.ts          # Custom hook for chat state management
│   ├── types
│   │   └── index.ts            # TypeScript interfaces and types
│   └── lib
│       └── utils.ts            # Utility functions for chat functionality
├── public
│   └── chat-widget.js          # JavaScript code for integration
├── package.json                 # npm configuration file
├── tsconfig.json                # TypeScript configuration file
├── next.config.js               # Next.js configuration file
└── README.md                    # Project documentation
```

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd nextjs-chat-widget
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the development server:
   ```
   npm run dev
   ```

## Integration with Salesforce

To integrate the chat widget into an existing Salesforce site, include the `public/chat-widget.js` file in your Salesforce page. This will enable the floating chat button and the associated chat functionality.

## Usage

Once integrated, users can click the floating chat button to open the chat window, where they can interact with the chat interface and search for products.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.