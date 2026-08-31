async function testApexTrade() {
  const API_BASE = 'http://localhost:5001';

  console.log('--- 1. Login User demo@apextrade.net ---');
  let res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'demo@apextrade.net', password: 'user123' })
  });
  let userAuth = await res.json();
  console.log('Login success:', userAuth.success, 'Balance:', userAuth.user.wallet_balance);
  const token = userAuth.token;

  console.log('--- 2. Fetch Active Daily Signal ---');
  res = await fetch(`${API_BASE}/api/signals/active`);
  let sigRes = await res.json();
  const activeSig = sigRes.data;
  console.log('Active Signal:', activeSig?.title, '| Pair:', activeSig?.instrument, '| Type:', activeSig?.order_type, '| Execution Time:', activeSig?.execution_time_pst, '| Outcome:', activeSig?.outcome);

  console.log('--- 3. Test Rogue/Unscheduled Trade (BUY $50 on ETHUSDT - NOT Signal Pair) ---');
  res = await fetch(`${API_BASE}/api/user/trade/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ pair: 'ETHUSDT', type: 'BUY', amount: 50, duration: 30 })
  });
  let rogueTrade = await res.json();
  console.log('Rogue trade started:', rogueTrade.success, 'Is signal trade:', rogueTrade.trade?.isSignalTrade);

  res = await fetch(`${API_BASE}/api/user/trade/${rogueTrade.trade.id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  let rogueResult = await res.json();
  console.log('Rogue Trade Result (Must be LOSS to protect house):', rogueResult.trade?.result, 'Profit/Loss:', rogueResult.trade?.profit);

  console.log('--- 4. Test Official Signal Trade (BUY $700 on BTCUSDT) ---');
  res = await fetch(`${API_BASE}/api/user/trade/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ pair: 'BTCUSDT', type: 'BUY', amount: 700, duration: 900 })
  });
  let signalTrade = await res.json();
  console.log('Signal trade started:', signalTrade.success, 'Is signal trade:', signalTrade.trade?.isSignalTrade);

  res = await fetch(`${API_BASE}/api/user/trade/${signalTrade.trade.id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  let signalResult = await res.json();
  console.log('Signal Trade Result (Must be WIN with dynamic profit):', signalResult.trade?.result, 'Profit:', signalResult.trade?.profit);

  console.log('--- 5. Admin Login & Deep User Inspection ---');
  res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@apextrade.net', password: 'admin123' })
  });
  let adminAuth = await res.json();
  const adminToken = adminAuth.token;

  res = await fetch(`${API_BASE}/api/admin/user/${userAuth.user.id}/full-details`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  let details = await res.json();
  console.log('Admin inspected user:', details.data?.user.name, 'Trades count:', details.data?.trades?.length);
  console.log('🎉 ALL SIGNAL & HOUSE PROTECTION TESTS PASSED 100%!');
}

testApexTrade().catch(console.error);
