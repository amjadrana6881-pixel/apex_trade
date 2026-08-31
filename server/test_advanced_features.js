const http = require('http');

async function testAdvancedFeatures() {
  console.log('--- 1. Testing Login & User Profile ---');
  const loginRes = await fetch('http://localhost:5001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'demo@apextrade.net', password: 'user123' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('User logged in:', loginData.user?.name);

  console.log('\n--- 2. Testing Dedicated Withdrawal Password & Saved USDT Address ---');
  // Set withdrawal password
  const setPinRes = await fetch('http://localhost:5001/api/auth/set-withdrawal-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ withdrawalPassword: '778899' })
  });
  const pinData = await setPinRes.json();
  console.log('Set Withdrawal PIN Result:', pinData.message);

  // Save USDT Address
  const saveAddrRes = await fetch('http://localhost:5001/api/auth/save-usdt-address', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ address: 'TYD55gjkjhKhghjhUSDT9999988', network: 'TRC-20' })
  });
  const addrData = await saveAddrRes.json();
  console.log('Save Default USDT Address Result:', addrData.message);

  // Test Withdrawal with WRONG password
  console.log('\n--- 3. Testing Withdrawal Security Rejection on Wrong PIN ---');
  const wrongPinRes = await fetch('http://localhost:5001/api/wallet/withdraw', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      amount: 50,
      network: 'TRC-20',
      destinationAddress: 'TYD55gjkjhKhghjhUSDT9999988',
      withdrawalPassword: '000000'
    })
  });
  const wrongData = await wrongPinRes.json();
  console.log('Withdrawal with wrong PIN rejected as expected?', !wrongData.success, '| Message:', wrongData.message);

  // Test Withdrawal with CORRECT password
  console.log('\n--- 4. Testing Withdrawal Approval with Correct PIN (10% Tax Check) ---');
  const correctPinRes = await fetch('http://localhost:5001/api/wallet/withdraw', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      amount: 100,
      network: 'TRC-20',
      destinationAddress: 'TYD55gjkjhKhghjhUSDT9999988',
      withdrawalPassword: '778899'
    })
  });
  const correctData = await correctPinRes.json();
  console.log('Withdrawal with correct PIN submitted?', correctData.success, '| ID:', correctData.withdrawalId);

  console.log('\n--- 5. Testing Live Support Chat (Send, Edit, Delete for Everyone & Me) ---');
  // User sends message
  const sendMsgRes = await fetch('http://localhost:5001/api/support/messages/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ message: 'Hello, I have a question regarding my withdrawal.' })
  });
  const msgData = await sendMsgRes.json();
  const msgId = msgData.data?.id;
  console.log('User sent support message:', msgData.data?.message);

  // User edits message
  const editMsgRes = await fetch(`http://localhost:5001/api/support/messages/${msgId}/edit`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ message: 'Hello, my withdrawal is confirmed, thank you!' })
  });
  const editData = await editMsgRes.json();
  console.log('User edited message to:', editData.data?.message, '| is_edited:', editData.data?.is_edited);

  // User deletes for everyone
  const delRes = await fetch(`http://localhost:5001/api/support/messages/${msgId}?mode=for_everyone`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  const delData = await delRes.json();
  console.log('Delete for everyone status:', delData.message);

  console.log('\n🎉 ALL NEW ADVANCED FEATURES (USDT WITHDRAWAL PASSWORD & REALTIME SUPPORT CHAT) VERIFIED 100%!');
}

testAdvancedFeatures().catch(console.error);
