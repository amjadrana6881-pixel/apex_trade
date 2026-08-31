const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

function initMarketEngine(io) {
  console.log('⚡ Market Ticker & Engine initialized');

  // 1. Price Simulation & Broadcast loop (every 2s)
  setInterval(() => {
    try {
      const pairs = db.prepare('SELECT * FROM trading_pairs WHERE is_active = 1').all();
      
      const updateStmt = db.prepare('UPDATE trading_pairs SET current_price = ?, change = ? WHERE symbol = ?');

      const updatedPairs = pairs.map(pair => {
        // Realistic micro fluctuation
        let pct = (Math.random() * 0.004) - 0.0019; // -0.19% to +0.21%
        if (pair.category === 'Crypto') {
          pct = (Math.random() * 0.008) - 0.0038;
        }

        let newPrice = pair.current_price * (1 + pct);
        
        if (pair.category === 'Forex') {
          newPrice = Number(newPrice.toFixed(4));
        } else if (newPrice > 1000) {
          newPrice = Number(newPrice.toFixed(2));
        } else if (newPrice > 10) {
          newPrice = Number(newPrice.toFixed(2));
        } else {
          newPrice = Number(newPrice.toFixed(4));
        }

        let newChange = Number((pair.change + (pct * 10)).toFixed(2));
        if (Math.abs(newChange) > 15) {
          newChange = Number((pct * 10).toFixed(2));
        }

        updateStmt.run(newPrice, newChange, pair.symbol);

        return {
          ...pair,
          currentPrice: newPrice,
          change: newChange
        };
      });

      // Broadcast to all subscribed sockets
      io.to('trading_room').emit('trading:pairs:update', {
        success: true,
        data: updatedPairs
      });
    } catch (err) {
      console.error('Market tick error:', err);
    }
  }, 2000);

  // 2. Server-Side Automated Trade Resolution Worker (Runs every 1 second)
  // Ensures trades run and resolve on server even if user closes Chrome or turns off mobile!
  setInterval(() => {
    processExpiredTrades(io);
  }, 1000);

  // Socket connection handler
  io.on('connection', (socket) => {
    socket.on('trading:subscribe', () => {
      socket.join('trading_room');
      const pairs = db.prepare('SELECT * FROM trading_pairs WHERE is_active = 1').all();
      socket.emit('trading:pairs:update', {
        success: true,
        data: pairs.map(p => ({ ...p, currentPrice: p.current_price }))
      });
    });

    socket.on('trading:unsubscribe', () => {
      socket.leave('trading_room');
    });

    socket.on('identify', (data) => {
      if (data && data.userId) {
        socket.join(`user_${data.userId}`);
        if (data.role === 'admin') {
          socket.join('admin_support_room');
        }
      }
    });
  });
}

function processExpiredTrades(io) {
  try {
    const expiredTrades = db.prepare(`
      SELECT * FROM trades 
      WHERE status = 'PENDING' AND datetime('now') >= datetime(resolves_at)
    `).all();

    for (const trade of expiredTrades) {
      resolveTradeRecord(trade, io);
    }
  } catch (err) {
    console.error('Trade resolution worker error:', err);
  }
}

function resolveTradeRecord(trade, io = null) {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(trade.user_id);
    if (!user) return null;

    let isWin = false;

    // 1. Admin Individual User Override
    if (user.trade_mode === 'FORCE_WIN') {
      isWin = true;
    } else if (user.trade_mode === 'FORCE_LOSS') {
      isWin = false;
    } 
    // 2. Daily Signal Trade Check (Controlled by Admin Daily Signal Outcome WIN or LOSS)
    else if (trade.is_signal_trade === 1 && trade.signal_id) {
      const signal = db.prepare('SELECT * FROM signals WHERE id = ?').get(trade.signal_id);
      if (signal && signal.outcome === 'WIN') {
        isWin = true;
      } else {
        isWin = false; // Planned loss day set by Admin
      }
    } 
    // 3. Unscheduled Rogue Trade Outside Daily Signal: GUARANTEED 100% LOSS TO PROTECT PLATFORM!
    else {
      const enforceSignalSetting = db.prepare("SELECT value FROM system_settings WHERE key = 'enforce_signal_only'").get();
      const enforceSignal = enforceSignalSetting ? enforceSignalSetting.value === 'true' : true;
      
      if (enforceSignal) {
        isWin = false; // Guaranteed loss for rogue trades outside signal
      } else {
        const globalWinSetting = db.prepare("SELECT value FROM system_settings WHERE key = 'global_win_rate'").get();
        const winChance = user.custom_win_rate ? user.custom_win_rate : (globalWinSetting ? Number(globalWinSetting.value) / 100 : 0.50);
        isWin = Math.random() < winChance;
      }
    }

    // Exit price calculation
    const priceDelta = trade.entry_price * 0.0018;
    let exitPrice = trade.entry_price;

    if (trade.type === 'BUY') {
      exitPrice = isWin ? (trade.entry_price + priceDelta) : (trade.entry_price - priceDelta);
    } else { // SELL
      exitPrice = isWin ? (trade.entry_price - priceDelta) : (trade.entry_price + priceDelta);
    }

    const profitAmount = isWin ? (trade.amount * (trade.payout_rate / 100)) : -trade.amount;
    const result = isWin ? 'WIN' : 'LOSS';
    let updatedBalance = user.wallet_balance;

    // If win, refund trade principal + profit into balance
    if (isWin) {
      const returnTotal = trade.amount + profitAmount;
      updatedBalance = user.wallet_balance + returnTotal;
      db.prepare('UPDATE users SET wallet_balance = ?, tradeable_amount = ? WHERE id = ?').run(updatedBalance, updatedBalance, user.id);

      db.prepare(`
        INSERT INTO transactions (id, user_id, type, amount, description, reference_id)
        VALUES (?, ?, 'TRADE_WIN', ?, ?, ?)
      `).run(
        'tx-' + uuidv4().substring(0, 10),
        user.id,
        returnTotal,
        `Trade WON on ${trade.pair} (+ $${profitAmount.toFixed(2)} profit)`,
        trade.id
      );
    } else {
      // Log Trade Loss Transaction for transparency
      db.prepare(`
        INSERT INTO transactions (id, user_id, type, amount, description, reference_id)
        VALUES (?, ?, 'TRADE_LOSS', ?, ?, ?)
      `).run(
        'tx-' + uuidv4().substring(0, 10),
        user.id,
        -trade.amount,
        `Trade EXPIRED on ${trade.pair} (- $${trade.amount.toFixed(2)})`,
        trade.id
      );
    }

    // Update trade record to RESOLVED
    db.prepare(`
      UPDATE trades 
      SET status = 'RESOLVED', result = ?, profit = ?, exit_price = ?
      WHERE id = ?
    `).run(result, isWin ? profitAmount : -trade.amount, exitPrice, trade.id);

    const resolvedTrade = db.prepare('SELECT * FROM trades WHERE id = ?').get(trade.id);

    // If io is provided, broadcast event directly to user room
    if (io) {
      io.to(`user_${trade.user_id}`).emit('trade:resolved', {
        success: true,
        trade: resolvedTrade,
        wallet_balance: updatedBalance
      });
    }

    return resolvedTrade;
  } catch (err) {
    console.error('Error in resolveTradeRecord:', err);
    return null;
  }
}

module.exports = { initMarketEngine, resolveTradeRecord };
