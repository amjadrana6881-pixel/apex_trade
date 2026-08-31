const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { resolveTradeRecord } = require('../sockets/marketEngine');

// Get all trading pairs
router.get('/trading-pairs', (req, res) => {
  try {
    const pairs = db.prepare('SELECT * FROM trading_pairs WHERE is_active = 1').all();
    return res.json({
      success: true,
      data: pairs
    });
  } catch (err) {
    console.error('Error fetching trading pairs:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch trading pairs.' });
  }
});

// Trade session details for a specific pair
router.get('/trade-session/:pair', (req, res) => {
  try {
    const { pair } = req.params;
    const cleanPair = pair.replace('/', '').toUpperCase();
    const pairData = db.prepare('SELECT * FROM trading_pairs WHERE symbol = ?').get(cleanPair);
    
    if (!pairData) {
      return res.status(404).json({ success: false, message: 'Pair not found' });
    }

    return res.json({
      success: true,
      data: {
        symbol: pairData.symbol,
        name: pairData.name,
        category: pairData.category,
        currentPrice: pairData.current_price,
        payoutRate: pairData.payout_rate,
        minBalance: 1.0,
        minTrade: 1.0,
        durations: [30, 60, 120, 180] // Max 3 Minutes
      }
    });
  } catch (err) {
    console.error('Error fetching trade session:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get User Balance
router.get('/user/balance', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT wallet_balance, tradeable_amount, investment_balance FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      data: {
        balance: user.wallet_balance,
        availableBalance: user.wallet_balance,
        tradeableAmount: user.tradeable_amount,
        investmentBalance: user.investment_balance
      }
    });
  } catch (err) {
    console.error('Error fetching balance:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get 100% Real User Portfolio Analytics (Calculated from SQLite database)
router.get('/user/portfolio-analytics', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // 1. Deposits sum
    const depRow = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM deposits WHERE user_id = ? AND status = 'APPROVED'").get(userId);
    const totalDeposited = depRow.total;

    // 2. Withdrawals sum
    const wthRow = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM withdrawals WHERE user_id = ? AND status = 'APPROVED'").get(userId);
    const totalWithdrawn = wthRow.total;

    // 3. Trades stats
    const trades = db.prepare('SELECT * FROM trades WHERE user_id = ? ORDER BY created_at DESC').all(userId);
    const totalTrades = trades.length;

    let winsCount = 0;
    let lossCount = 0;
    let totalProfitWon = 0;
    let totalLossAmount = 0;

    for (const t of trades) {
      if (t.result === 'WIN') {
        winsCount++;
        totalProfitWon += Number(t.profit || 0);
      } else if (t.result === 'LOSS') {
        lossCount++;
        totalLossAmount += Number(t.amount || 0);
      }
    }

    const netTradingPnL = totalProfitWon - totalLossAmount;
    const winRate = totalTrades > 0 ? Math.round((winsCount / totalTrades) * 100) : 0;

    return res.json({
      success: true,
      data: {
        walletBalance: user.wallet_balance,
        totalDeposited,
        totalWithdrawn,
        totalTrades,
        winsCount,
        lossCount,
        totalProfitWon,
        totalLossAmount,
        netTradingPnL,
        winRate,
        recentTrades: trades.slice(0, 5)
      }
    });
  } catch (err) {
    console.error('Error fetching portfolio analytics:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Check if user has an Active Running Trade (Works across page refreshes / mobile reopen)
router.get('/user/active-trade', authenticateToken, (req, res) => {
  try {
    const runningTrade = db.prepare(`
      SELECT * FROM trades 
      WHERE user_id = ? AND status = 'PENDING' 
      ORDER BY created_at DESC LIMIT 1
    `).get(req.user.id);

    if (!runningTrade) {
      return res.json({ success: true, hasActiveTrade: false });
    }

    const now = Date.now();
    const expiryTime = new Date(runningTrade.resolves_at).getTime();
    const secondsRemaining = Math.max(0, Math.floor((expiryTime - now) / 1000));

    // If time has already elapsed, auto-resolve it
    if (secondsRemaining <= 0) {
      const resolved = resolveTradeRecord(runningTrade);
      return res.json({
        success: true,
        hasActiveTrade: false,
        lastResolvedTrade: resolved
      });
    }

    return res.json({
      success: true,
      hasActiveTrade: true,
      trade: runningTrade,
      secondsRemaining
    });
  } catch (err) {
    console.error('Active trade check error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Start Trade (Supports any trade amount up to user's full balance, max 180s duration)
router.post('/user/trade/start', authenticateToken, (req, res) => {
  try {
    const { pair, type, amount, duration } = req.body;
    const tradeAmount = Number(amount);
    const rawDuration = Number(duration) || 60;
    const tradeDuration = Math.min(180, Math.max(30, rawDuration));

    if (!pair || !type || isNaN(tradeAmount) || tradeAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Please enter a valid trade amount.' });
    }

    const cleanPair = pair.replace('/', '').toUpperCase();
    const pairData = db.prepare('SELECT * FROM trading_pairs WHERE symbol = ? AND is_active = 1').get(cleanPair);
    if (!pairData) {
      return res.status(400).json({ success: false, error: 'Selected asset pair is unavailable.' });
    }

    // Check balance
    const user = db.prepare('SELECT wallet_balance, trade_mode, custom_win_rate FROM users WHERE id = ?').get(req.user.id);
    if (!user || user.wallet_balance < tradeAmount) {
      return res.status(400).json({ success: false, error: `Insufficient wallet balance ($${Number(user?.wallet_balance || 0).toFixed(2)} available).` });
    }

    // Check against active daily trading signal (5.0% dynamic return model -> ~20 days recovery)
    const activeSignal = db.prepare("SELECT * FROM signals WHERE status = 'ACTIVE' ORDER BY created_at DESC LIMIT 1").get();
    
    let isSignalTrade = 0;
    let signalId = '';
    let appliedPayout = pairData.payout_rate || 88.0;

    if (activeSignal) {
      const sigPair = activeSignal.instrument.replace('/', '').toUpperCase();
      const sigType = activeSignal.order_type.toUpperCase();
      
      if (cleanPair === sigPair && type.toUpperCase() === sigType) {
        isSignalTrade = 1;
        signalId = activeSignal.id;
        if (activeSignal.profit_percentage > 0) {
          appliedPayout = activeSignal.profit_percentage;
        } else {
          // Dynamic 4.85% - 5.15% (~5.0% daily)
          appliedPayout = Number((4.85 + Math.random() * 0.30).toFixed(2));
        }
      }
    }

    // Deduct trade capital from balance immediately
    const newBalance = user.wallet_balance - tradeAmount;
    db.prepare('UPDATE users SET wallet_balance = ?, tradeable_amount = ? WHERE id = ?').run(newBalance, newBalance, req.user.id);

    const tradeId = 'trd-' + uuidv4().substring(0, 10);
    const resolvesAt = new Date(Date.now() + tradeDuration * 1000).toISOString();

    db.prepare(`
      INSERT INTO trades (id, user_id, pair, type, amount, entry_price, duration, payout_rate, is_signal_trade, signal_id, status, result, resolves_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', 'PENDING', ?)
    `).run(
      tradeId,
      req.user.id,
      cleanPair,
      type.toUpperCase(),
      tradeAmount,
      pairData.current_price,
      tradeDuration,
      appliedPayout,
      isSignalTrade,
      signalId,
      resolvesAt
    );

    // Record deduction transaction
    db.prepare(`
      INSERT INTO transactions (id, user_id, type, amount, description, reference_id)
      VALUES (?, ?, 'TRADE_ORDER', ?, ?, ?)
    `).run(
      'tx-' + uuidv4().substring(0, 10),
      req.user.id,
      -tradeAmount,
      `Placed ${type.toUpperCase()} Option on ${cleanPair} ($${tradeAmount.toFixed(2)})${isSignalTrade ? ' [Official Signal]' : ''}`,
      tradeId
    );

    return res.json({
      success: true,
      trade: {
        id: tradeId,
        pair: cleanPair,
        type: type.toUpperCase(),
        amount: tradeAmount,
        entryPrice: pairData.current_price,
        duration: tradeDuration,
        payoutRate: appliedPayout,
        isSignalTrade,
        resolves_at: resolvesAt
      },
      session: {
        durationSec: tradeDuration
      }
    });
  } catch (err) {
    console.error('Error starting trade:', err);
    return res.status(500).json({ success: false, error: 'Internal error executing trade.' });
  }
});

// Resolve Trade Endpoint (Instant query or auto-resolve if expired)
router.get('/user/trade/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const trade = db.prepare('SELECT * FROM trades WHERE id = ? AND user_id = ?').get(id, req.user.id);

    if (!trade) {
      return res.status(404).json({ success: false, error: 'Trade not found.' });
    }

    if (trade.status === 'RESOLVED') {
      return res.json({
        success: true,
        trade
      });
    }

    // If still pending but time passed, resolve now
    const now = Date.now();
    const expiryTime = new Date(trade.resolves_at).getTime();

    if (now >= expiryTime) {
      const resolved = resolveTradeRecord(trade);
      return res.json({
        success: true,
        trade: resolved
      });
    }

    // Still running
    const secondsRemaining = Math.max(0, Math.floor((expiryTime - now) / 1000));
    return res.json({
      success: true,
      trade,
      secondsRemaining
    });
  } catch (err) {
    console.error('Error in trade resolution:', err);
    return res.status(500).json({ success: false, error: 'Failed to query trade status.' });
  }
});

// Get User's Trades
router.get('/user/trades', authenticateToken, (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(5, parseInt(req.query.pageSize) || 10));
    const offset = (page - 1) * pageSize;

    const totalCount = db.prepare('SELECT count(*) as count FROM trades WHERE user_id = ?').get(req.user.id).count;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    const trades = db.prepare(`
      SELECT * FROM trades 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `).all(req.user.id, pageSize, offset);

    return res.json({
      success: true,
      data: trades,
      meta: {
        page,
        pageSize,
        total: totalCount,
        totalPages
      }
    });
  } catch (err) {
    console.error('Error fetching trade history:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
