require('dotenv').config();
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

// Body parser fix for serverless events & raw payloads
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
    return next();
  }
  
  if (typeof req.body === 'string' && req.body.trim().length > 0) {
    try {
      req.body = JSON.parse(req.body);
    } catch (e) {}
  } else if (req.rawBody && typeof req.rawBody === 'string') {
    try {
      req.body = JSON.parse(req.rawBody);
    } catch (e) {}
  } else if (req.apiGateway && req.apiGateway.event && req.apiGateway.event.body) {
    try {
      const raw = req.apiGateway.event.isBase64Encoded 
        ? Buffer.from(req.apiGateway.event.body, 'base64').toString('utf8')
        : req.apiGateway.event.body;
      req.body = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (e) {}
  }
  next();
});

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '../../server/uploads')));

// Universal API Router
const apiRouter = express.Router();
apiRouter.use('/auth', require('../../server/routes/auth'));
apiRouter.use('/signals', require('../../server/routes/signals'));
apiRouter.use('/wallet', require('../../server/routes/wallet'));
apiRouter.use('/investments', require('../../server/routes/investments'));
apiRouter.use('/wheel', require('../../server/routes/wheel'));
apiRouter.use('/referral', require('../../server/routes/referral'));
apiRouter.use('/announcements', require('../../server/routes/announcements'));
apiRouter.use('/support', require('../../server/routes/support'));
apiRouter.use('/admin', require('../../server/routes/admin'));
apiRouter.use('/', require('../../server/routes/trading'));

apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'ApexTrade Pro Options & Signals Platform',
    timestamp: new Date().toISOString()
  });
});

// Mount on all possible Netlify serverless prefix variations
app.use('/api', apiRouter);
app.use('/.netlify/functions/api/api', apiRouter);
app.use('/.netlify/functions/api', apiRouter);
app.use('/', apiRouter);

module.exports.handler = serverless(app, {
  request: (req, event, context) => {
    if (event.body) {
      if (typeof event.body === 'string') {
        try {
          req.body = JSON.parse(event.body);
        } catch (e) {
          req.body = event.body;
        }
      } else {
        req.body = event.body;
      }
    }
  }
});
