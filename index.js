// Dependencies to install:
// npm install whatsapp-web.js express qrcode-terminal qrcode socket.io

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
        keywords: ['perkhidmatan', 'service', 'khidmat', 'bantuan'],
        response: 'Kerajaan Negeri Perak menawarkan pelbagai perkhidmatan dalam talian seperti pembayaran cukai, semakan status permohonan, aduan awam, dan banyak lagi. Adakah anda ingin maklumat tentang perkhidmatan tertentu?'
    },
    {
        keywords: ['aduan', 'complaint', 'lapor', 'report'],
        response: 'Untuk membuat aduan kepada Kerajaan Negeri Perak, anda boleh menggunakan sistem e-Aduan kami. Anda perlu mendaftar akaun, kemudian isi borang aduan dengan maklumat terperinci. Aduan anda akan diproses dalam tempoh 3-5 hari bekerja.'
    },
    {
        keywords: ['cukai', 'tax', 'bayar', 'payment'],
        response: 'Pembayaran cukai tanah dan cukai taksiran boleh dibuat secara dalam talian melalui portal e-Perkhidmatan kami. Anda juga boleh membuat pembayaran di kaunter Pejabat Tanah & Daerah atau Pihak Berkuasa Tempatan yang berkaitan.'
    },
    {
        keywords: ['waktu operasi', 'waktu pejabat', 'office hours', 'operation time'],
        response: 'Waktu operasi pejabat Kerajaan Negeri Perak adalah:\n\nIsnin - Khamis: 8:00 pagi - 1:00 petang, 2:00 petang - 5:00 petang\nJumaat: 8:00 pagi - 12:15 tengahari, 2:45 petang - 5:00 petang\n\nPejabat ditutup pada hari Sabtu, Ahad dan cuti umum.'
    },
    {
        keywords: ['lokasi', 'alamat', 'address', 'location', 'pejabat'],
        response: 'Pejabat Setiausaha Kerajaan Negeri Perak terletak di:\n\nBangunan Perak Darul Ridzuan,\nJalan Panglima Bukit Gantang Wahab,\n30000, Ipoh, Perak Darul Ridzuan,\nMalaysia.\n\nNo. Tel: 05-2095000\nNo. Faks: 05-2555026'
    },
    {
        keywords: ['borang', 'form', 'download', 'muat turun'],
        response: 'Pelbagai borang permohonan boleh dimuat turun dari bahagian e-Perkhidmatan di portal kami. Sila pilih jenis perkhidmatan yang anda perlukan untuk mencari borang yang berkaitan. Borang yang telah dilengkapkan boleh dihantar secara dalam talian atau di kaunter berkaitan.'
    },
    {
        keywords: ['tender', 'sebut harga', 'quotation', 'procurement'],
        response: 'Maklumat tender dan sebut harga semasa boleh didapati di bahagian "Iklan & Sebut Harga" di portal kami. Dokumen tender boleh dibeli dari Pejabat Kewangan Negeri. Semua permohonan hendaklah diserahkan sebelum tarikh tutup yang dinyatakan.'
    },
    {
        keywords: ['jawatan kosong', 'kerja', 'job', 'vacancy', 'career'],
        response: 'Jawatan kosong di Kerajaan Negeri Perak akan diiklankan di bahagian "Iklan Jawatan Kosong" di portal kami. Permohonan hendaklah dibuat secara dalam talian melalui sistem SPA (Suruhanjaya Perkhidmatan Awam) atau portal JobsMalaysia.'
    },
    {
        keywords: ['pelancongan', 'tourism', 'lawat', 'visit', 'tempat menarik'],
        response: 'Negeri Perak mempunyai banyak tempat pelancongan menarik seperti Taman Royal Belum, Gua Tempurung, Kuala Kangsar, dan banyak lagi. Untuk maklumat lanjut tentang destinasi pelancongan di Perak, sila layari bahagian Pelancongan di portal kami.'
    },
    {
        keywords: ['pendidikan', 'education', 'sekolah', 'school', 'universiti'],
        response: 'Untuk maklumat berkaitan pendidikan di negeri Perak, termasuk senarai sekolah, institusi pengajian tinggi, dan program pendidikan khas, sila layari bahagian Pendidikan di portal kami. Anda juga boleh menghubungi Jabatan Pendidikan Negeri Perak di talian 05-501 5000.'
    },
    {
        keywords: ['sultan', 'raja', 'diraja', 'tuanku', 'royal'],
        response: 'DYMM Paduka Seri Sultan Perak, Sultan Nazrin Muizzuddin Shah Ibni Almarhum Sultan Azlan Muhibbuddin Shah Al-Maghfur-Lah adalah Sultan Perak yang ke-35. Untuk maklumat lanjut tentang Institusi Diraja Perak, sila layari bahagian Info Perak > Diraja di portal kami.'
    },
    {
        keywords: ['menteri besar', 'mb', 'chief minister'],
        response: 'YAB Menteri Besar Perak adalah ketua kerajaan negeri. Untuk maklumat lanjut tentang YAB Menteri Besar dan ahli Majlis Mesyuarat Kerajaan Negeri Perak, sila layari bahagian Kerajaan > Pentadbiran Negeri di portal kami.'
    },
    {
        keywords: ['covid', 'koronavirus', 'coronavirus', 'vaksin', 'vaccine'],
        response: 'Untuk maklumat terkini berkaitan COVID-19 di negeri Perak, termasuk pusat vaksinasi, statistik kes, dan SOP semasa, sila rujuk ke pengumuman rasmi di portal kami atau layari portal COVID-19 Kerajaan Negeri Perak.'
    },
    {
        keywords: ['majlis perbandaran', 'local council', 'mpk', 'mbi', 'mbp'],
        response: 'Negeri Perak mempunyai beberapa Pihak Berkuasa Tempatan termasuk Majlis Bandaraya Ipoh (MBI), Majlis Perbandaran Taiping (MPT), dan lain-lain. Untuk maklumat lanjut atau untuk menghubungi PBT tertentu, sila layari bahagian Direktori > Pihak Berkuasa Tempatan di portal kami.'
    },
    {
        keywords: ['bantuan', 'subsidi', 'aid', 'assistance', 'welfare'],
        response: 'Kerajaan Negeri Perak menawarkan pelbagai program bantuan untuk penduduk yang layak. Ini termasuk bantuan kewangan, program perumahan, dan program bantuan pendidikan. Untuk maklumat lanjut atau untuk memohon, sila hubungi Jabatan Kebajikan Masyarakat Negeri Perak.'
    }
];

// Welcome message for new users
let welcomeMessage = "Selamat datang ke Portal Rasmi Kerajaan Negeri Perak! Saya adalah bot bantuan automatik. Bagaimana saya boleh membantu anda hari ini?";

// Track users who have already been greeted
let greetedUsers = new Set();

// Clear greeted users list at midnight each day to reset greetings
function scheduleDailyReset() {
  const now = new Date();
  const night = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1, // tomorrow
    0, // midnight
    0, 
    0
  );
  const timeToMidnight = night.getTime() - now.getTime();
  
  setTimeout(() => {
    console.log('Clearing greeted users list for the day');
    greetedUsers.clear();
    scheduleDailyReset(); // Schedule the next day's reset
  }, timeToMidnight);
  
  console.log(`Scheduled greeted users reset in ${Math.floor(timeToMidnight / 1000 / 60)} minutes`);
}

// Route to update keyword responses
app.post('/update-responses', (req, res) => {
  if (req.body.keywordResponses) {
    keywordResponses = req.body.keywordResponses;
    res.json({ success: true, message: 'Responses updated successfully' });
  } else {
    res.status(400).json({ success: false, message: 'Invalid data format' });
  }
});

// Route to update welcome message
app.post('/update-greeting', (req, res) => {
  if (req.body.welcomeMessage) {
    welcomeMessage = req.body.welcomeMessage;
    res.json({ success: true, message: 'Greeting message updated successfully' });
  } else {
    res.status(400).json({ success: false, message: 'Invalid data format' });
  }
});

// Initialize WhatsApp client
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: './whatsapp-session' // Specify a persistent directory for Railway
  }),
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
      '--single-process', // Important for Railway deployment
      '--disable-extensions'
    ]
  }
});

// QR code handler
client.on('qr', (qr) => {
  console.log('QR RECEIVED');
  
  // Display QR in terminal for headless environments
  qrcode_terminal.generate(qr, { small: true });
  
  // Generate QR code as image and send to client
  qrcode.toDataURL(qr, (err, url) => {
    if (err) {
      console.error('Error generating QR code URL:', err);
      return;
    }
    console.log('QR code URL generated');
    io.emit('qr', { url });
  });
});

// When client is ready
client.on('ready', () => {
  console.log('Client is ready!');
  io.emit('ready', { message: 'WhatsApp is connected!' });
  
  // Schedule the daily reset of greeted users
  scheduleDailyReset();
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
  // Get the chat ID from the message
  const chatId = msg.from;
  const messageText = msg.body.toLowerCase();
  let replied = false;
  
  // If this is a first message from a user today, send the welcome message
  if (!greetedUsers.has(chatId)) {
    try {
      await client.sendMessage(chatId, welcomeMessage);
      console.log(`Sent welcome message to new user: ${chatId}`);
      greetedUsers.add(chatId);
      replied = true;
      io.emit('message', { 
        from: chatId, 
        body: messageText, 
        replied: true,
        autoGreeting: true
      });
    } catch (error) {
      console.error('Error sending welcome message:', error);
    }
  }

  // Existing keyword response logic
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
  if (!replied || !greetedUsers.has(chatId)) {
    io.emit('message', { from: chatId, body: messageText, replied });
  }
});

// Socket connection
io.on('connection', (socket) => {
  console.log('A user connected');
  socket.emit('config', { 
    keywordResponses,
    welcomeMessage 
  });

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
    io.emit('config', { 
      keywordResponses,
      welcomeMessage 
    });
  });
  
  // Update greeting message
  socket.on('update-greeting', (data) => {
    if (data.welcomeMessage) {
      welcomeMessage = data.welcomeMessage;
      io.emit('config', { 
        keywordResponses,
        welcomeMessage 
      });
    }
  });
});

// Initialize the client
client.initialize();

// Start the server
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});