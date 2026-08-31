const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '../../server/uploads')));

// Mount all API Routes
app.use('/api/auth', require('../../server/routes/auth'));
app.use('/api', require('../../server/routes/trading'));
app.use('/api/signals', require('../../server/routes/signals'));
app.use('/api/wallet', require('../../server/routes/wallet'));
app.use('/api/investments', require('../../server/routes/investments'));
app.use('/api/wheel', require('../../server/routes/wheel'));
app.use('/api/referral', require('../../server/routes/referral'));
app.use('/api/announcements', require('../../server/routes/announcements'));
app.use('/api/support', require('../../server/routes/support'));
app.use('/api/admin', require('../../server/routes/admin'));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'ApexTrade Pro Options & Signals Platform (Netlify Serverless)',
    timestamp: new Date().toISOString()
  });
});

module.exports.handler = serverless(app);
