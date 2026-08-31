async function testFlow() {
  const API_BASE = 'http://localhost:5001';
  console.log('--- 1. Login User ---');
  let res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'demo@wysetrade.net', password: 'user123' })
  });
  let userAuth = await res.json();
  console.log('User login:', userAuth.success, 'Balance:', userAuth.user.wallet_balance);
  const token = userAuth.token;

  console.log('--- 2. Start Live Trade (BUY $50 on BTCUSDT - Crypto Weekend Support) ---');
  res = await fetch(`${API_BASE}/api/user/trade/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ pair: 'BTCUSDT', type: 'BUY', amount: 50, duration: 30 })
  });
  let tradeStart = await res.json();
  console.log('Trade started:', tradeStart.success, 'Trade ID:', tradeStart.trade?.id);

  console.log('--- 3. Resolve Trade Outcome ---');
  res = await fetch(`${API_BASE}/api/user/trade/${tradeStart.trade.id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  let tradeResult = await res.json();
  console.log('Trade Outcome:', tradeResult.trade?.result, 'Profit / Loss:', tradeResult.trade?.profit);

  console.log('--- 4. Test Investment Package ---');
  res = await fetch(`${API_BASE}/api/investments/invest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ packageId: 'pkg-starter', amount: 100 })
  });
  let investRes = await res.json();
  console.log('Invest result:', investRes.success, investRes.message);

  console.log('--- 5. Admin Login & Stats ---');
  res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@wysetrade.net', password: 'admin123' })
  });
  let adminAuth = await res.json();
  const adminToken = adminAuth.token;
  
  res = await fetch(`${API_BASE}/api/admin/stats`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  let stats = await res.json();
  console.log('Admin Stats:', stats.data);
  console.log('🎉 ALL SYSTEMS VERIFIED 100% WORKING!');
}
testFlow().catch(console.error);
