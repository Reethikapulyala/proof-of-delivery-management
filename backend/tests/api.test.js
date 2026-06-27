const assert = require('assert');
const http = require('http');

function request(options, payload = null) {
  return new Promise((resolve, reject) => {
    const dataString = payload ? JSON.stringify(payload) : null;
    
    if (dataString) {
      options.headers = options.headers || {};
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(dataString);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: data
          });
        }
      });
    });
    
    req.on('error', reject);
    if (dataString) {
      req.write(dataString);
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== RUNNING BACKEND UNIT & INTEGRATION TESTS ===');
  let failures = 0;

  // Test 1: User Login Auth
  try {
    console.log('\n[TEST 1] POST /api/users/login - Valid credentials');
    const res = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/users/login',
      method: 'POST'
    }, {
      email: 'admin@hkshipping.com',
      password: 'admin123'
    });
    assert.strictEqual(res.statusCode, 200, 'Login should return 200 OK');
    assert.ok(res.body.token, 'Response should include a signed JWT token');
    assert.strictEqual(res.body.user.role, 'Super Admin', 'User role should match Super Admin');
    console.log('✓ TEST 1 PASSED');
  } catch (e) {
    console.error('✗ TEST 1 FAILED:', e.message);
    failures++;
  }

  // Test 2: User Login Auth - Invalid Credentials
  try {
    console.log('\n[TEST 2] POST /api/users/login - Invalid passcode');
    const res = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/users/login',
      method: 'POST'
    }, {
      email: 'admin@hkshipping.com',
      password: 'wrongpassword'
    });
    assert.strictEqual(res.statusCode, 401, 'Invalid login should return 401 Unauthorized');
    console.log('✓ TEST 2 PASSED');
  } catch (e) {
    console.error('✗ TEST 2 FAILED:', e.message);
    failures++;
  }

  // Test 3: GET /api/dashboard - Access without JWT Token
  try {
    console.log('\n[TEST 3] GET /api/dashboard - Awaiting token check (401 expected)');
    const res = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/dashboard',
      method: 'GET'
    });
    assert.strictEqual(res.statusCode, 401, 'Requests without JWT should return 401 Access Denied');
    console.log('✓ TEST 3 PASSED');
  } catch (e) {
    console.error('✗ TEST 3 FAILED:', e.message);
    failures++;
  }

  // Final Summary
  console.log(`\n=== TEST RUN COMPLETED. FAILURES: ${failures} ===`);
  process.exit(failures > 0 ? 1 : 0);
}

// Start testing suite
runTests().catch(err => {
  console.error('Test suite runner encountered critical error:', err);
  process.exit(1);
});
