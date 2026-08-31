const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// CORS configuration
app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.set('io', io);

// Import & Initialize Market Engine & Sockets
const { initMarketEngine } = require('./sockets/marketEngine');
initMarketEngine(io);

// Mount API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api', require('./routes/trading'));
app.use('/api/signals', require('./routes/signals'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/investments', require('./routes/investments'));
app.use('/api/wheel', require('./routes/wheel'));
app.use('/api/referral', require('./routes/referral'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/support', require('./routes/support'));
app.use('/api/admin', require('./routes/admin'));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'ApexTrade Pro Options & Signals Platform',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`🚀 ApexTrade Backend Server running on http://localhost:${PORT}`);
});
