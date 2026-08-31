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

module.exports.handler = serverless(app);
