// Modified version of index.js for Heroku deployment
const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const qrcode = require('qrcode');
const socketIO = require('socket.io');
const http = require('http');
const path = require('path');
const qrcode_terminal = require('qrcode-terminal');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const port = process.env.PORT || 8000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Configure the keywords and responses
let keywordResponses = [
    {
        keywords: ['hello', 'hi', 'hey', 'salam', 'selamat'],
        response: 'Selamat datang ke Portal Rasmi Kerajaan Negeri Perak! Bagaimana saya boleh membantu anda hari ini?'
    },
    // ... all your other keyword responses from index.js
];

// Route to update keyword responses
app.post('/update-responses', (req, res) => {
  if (req.body.keywordResponses) {
    keywordResponses = req.body.keywordResponses;
    res.json({ success: true, message: 'Responses updated successfully' });
  } else {
    res.status(400).json({ success: false, message: 'Invalid data format' });
  }
});

// Initialize WhatsApp client with Heroku-specific configurations
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--single-process' // This is important for Heroku
    ]
  }
});

// Modify the QR event handler to also show the QR in terminal
client.on('qr', (qr) => {
  console.log('QR RECEIVED');
  
  // Generate QR code as image and send to client
  qrcode.toDataURL(qr, (err, url) => {
    if (err) {
      console.error('Error generating QR code URL:', err);
      return;
    }
    console.log('QR code URL generated');
    io.emit('qr', { url });
  });
  
  // Also generate QR in console (useful for Heroku logs)
  qrcode_terminal.generate(qr, {small: true});
});

// When client is ready
client.on('ready', () => {
  console.log('Client is ready!');
  io.emit('ready', { message: 'WhatsApp is connected!' });
});

// When client is authenticated
client.on('authenticated', () => {
  console.log('Client is authenticated!');
  io.emit('authenticated', { message: 'WhatsApp is authenticated!' });
});

// When authentication fails
client.on('auth_failure', (msg) => {
  console.error('Authentication failure', msg);
  io.emit('auth_failure', { message: 'Authentication failed!' });
});

// When disconnected
client.on('disconnected', (reason) => {
  console.log('Client was disconnected', reason);
  io.emit('disconnected', { message: 'WhatsApp was disconnected!' });
  // Reinitialize the client
  client.initialize();
});

// Handle incoming messages
client.on('message', async (msg) => {
    const messageText = msg.body.toLowerCase();
    let replied = false;
  
    // Check if the message contains any of our keywords
    for (const item of keywordResponses) {
      // Look for any matching keywords in the message
      const hasKeyword = item.keywords.some(keyword => 
        messageText.includes(keyword.toLowerCase())
      );
      
      if (hasKeyword) {
        try {
          await msg.reply(item.response);
          console.log(`Replied to message with keyword match: ${messageText}`);
          replied = true;
          break; // Stop checking after the first match
        } catch (error) {
          console.error('Error sending reply:', error);
        }
      }
    }
  
    // Log the incoming message and whether we replied
    console.log(`Received message: ${messageText} - Replied: ${replied}`);
    io.emit('message', { from: msg.from, body: msg.body, replied });
});

// Socket connection
io.on('connection', (socket) => {
  console.log('A user connected');
  socket.emit('config', { keywordResponses });

  // Listen for manual message send
  socket.on('send-message', async (data) => {
    const { number, message } = data;
    if (number && message) {
      try {
        const formattedNumber = number.includes('@c.us') ? number : `${number}@c.us`;
        await client.sendMessage(formattedNumber, message);
        socket.emit('message-sent', { success: true, to: formattedNumber, message });
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message-sent', { success: false, error: error.message });
      }
    }
  });

  // Update keyword responses
  socket.on('update-responses', (data) => {
    keywordResponses = data.keywordResponses;
    io.emit('config', { keywordResponses });
  });
});

// Initialize the client
client.initialize();

// Start the server
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});