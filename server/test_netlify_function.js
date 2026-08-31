const { handler } = require('../netlify/functions/api');

async function testNetlifyHandler() {
  console.log('--- Testing Netlify Serverless Handler locally ---');
  
  // Test 1: GET /api/trading-pairs
  const event1 = {
    httpMethod: 'GET',
    path: '/api/trading-pairs',
    headers: { host: 'localhost' },
    queryStringParameters: null,
    body: null
  };
  
  const res1 = await handler(event1, {});
  console.log('Response 1 Status Code:', res1.statusCode);
  console.log('Response 1 Body preview:', res1.body?.substring(0, 150));

  // Test 2: POST /api/auth/send-register-otp
  const event2 = {
    httpMethod: 'POST',
    path: '/api/auth/send-register-otp',
    headers: { 'content-type': 'application/json', host: 'localhost' },
    queryStringParameters: null,
    body: JSON.stringify({ email: 'netlify_test@example.com' })
  };

  const res2 = await handler(event2, {});
  console.log('\nResponse 2 Status Code:', res2.statusCode);
  console.log('Response 2 Body preview:', res2.body?.substring(0, 150));
}

testNetlifyHandler().catch(console.error);
