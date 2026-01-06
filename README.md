# WhatsApp Autoresponder

A WhatsApp auto-reply bot with auto-greeting feature, built with Node.js and whatsapp-web.js.

## Features

- **WhatsApp Web Integration** - Automated messaging using Puppeteer headless browser
- **Auto-Reply** - Configurable keyword matching for intelligent automated responses
- **Auto-Greeting** - Automatically welcomes first-time users with customizable message
- **Web Dashboard** - Real-time configuration with QR authentication and activity logging
- **Real-time Updates** - Socket.IO for live bidirectional communication
- **Cloud Ready** - Session persistence with LocalAuth (Railway/Heroku compatible)

## Tech Stack

- Node.js 16.x
- Express.js
- Socket.IO
- whatsapp-web.js
- Puppeteer
- QRCode

## Installation

```bash
# Clone the repository
git clone https://github.com/Kiyoraka/WhatsApp-Chat-Bot-AutoReply.git

# Navigate to directory
cd WhatsApp-Chat-Bot-AutoReply

# Install dependencies
npm install
```

## Usage

```bash
# Start the server
npm start

# Development mode with auto-reload
npm run dev
```

Open your browser and navigate to `http://localhost:8000`

## How It Works

1. **Scan QR Code** - Open the web dashboard and scan the QR code with WhatsApp
2. **Configure Responses** - Add keyword-response pairs through the web interface
3. **Set Greeting** - Customize the welcome message for first-time users
4. **Bot Active** - The bot automatically replies based on configured keywords

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/update-responses` | Update keyword responses |
| POST | `/update-greeting` | Update welcome message |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 8000 | Server port |

## Deployment

The project is configured for cloud deployment with:
- Persistent session storage via LocalAuth
- Puppeteer optimized for containerized environments
- No sandbox mode for compatibility

## License

MIT License

## Author

Kiyo Software TechLab
