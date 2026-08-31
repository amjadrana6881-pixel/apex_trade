const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Get all active announcements
router.get('/', (req, res) => {
  try {
    const list = db.prepare('SELECT * FROM announcements WHERE is_active = 1 ORDER BY created_at DESC LIMIT 20').all();
    return res.json({
      success: true,
      data: list
    });
  } catch (err) {
    console.error('Error fetching announcements:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
