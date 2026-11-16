const http = require('http');
const userRepo = require('../repositories/userRepository');
const passwordResetRepo = require('../repositories/passwordResetRepository');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    }, (res) => {
      let rawData = '';
      res.on('data', chunk => rawData += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(rawData) });
        } catch (e) {
          resolve({ status: res.statusCode, body: rawData });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function testHttpFlow() {
  const email = 'abineshr005@gmail.com';
  console.log(`Starting HTTP API end-to-end test for ${email}...`);

  // Cache user original password
  const userBefore = await userRepo.findUserByEmail(email);
  const originalPasswordHash = userBefore.Password || userBefore.password;

  try {
    // 1. Request OTP
    const req1 = await post('/api/auth/forgot-password', { email });
    console.log('1. POST /forgot-password status:', req1.status);
    if (req1.status !== 200 || !req1.body.devOtp) {
      throw new Error('Forgot password request failed');
    }
    const devOtp = req1.body.devOtp;
    console.log('   Received Dev OTP:', devOtp);

    // 2. Test Invalid OTP
    const reqInvalid = await post('/api/auth/verify-reset-otp', { email, otp: '000000' });
    console.log('2. Invalid OTP check status:', reqInvalid.status);
    if (reqInvalid.status !== 400) {
      throw new Error(`Expected 400 for invalid OTP, got ${reqInvalid.status}`);
    }

    // 3. Test Valid OTP
    const req2 = await post('/api/auth/verify-reset-otp', { email, otp: devOtp });
    console.log('3. POST /verify-reset-otp status:', req2.status);
    if (req2.status !== 200 || !req2.body.resetToken) {
      throw new Error('Verify reset OTP failed');
    }
    const resetToken = req2.body.resetToken;
    console.log('   Received Reset Token successfully');

    // 4. Test Weak Password
    const reqWeak = await post('/api/auth/reset-password', {
      email,
      resetToken,
      newPassword: 'weak',
      confirmPassword: 'weak',
    });
    console.log('4. Weak password rejection status:', reqWeak.status);
    if (reqWeak.status !== 400) {
      throw new Error(`Expected 400 for weak password, got ${reqWeak.status}`);
    }

    // 5. Test Strong Password
    const req3 = await post('/api/auth/reset-password', {
      email,
      resetToken,
      newPassword: 'NewStrongPassword@2026',
      confirmPassword: 'NewStrongPassword@2026',
    });
    console.log('5. POST /reset-password status:', req3.status, req3.body.message);
    if (req3.status !== 200) {
      throw new Error('Reset password failed');
    }

    console.log('\n🎉 HTTP API End-to-End Flow Succeeded!');
  } finally {
    // Restore original password
    await userRepo.updateUser(userBefore.id, { password: originalPasswordHash }, userBefore.role);
    await passwordResetRepo.consumeResetRecords(email);
    console.log('✅ Safely restored user original password hash and cleaned up test tokens.');
    process.exit(0);
  }
}

testHttpFlow().catch(err => {
  console.error('❌ HTTP API Test failed:', err);
  process.exit(1);
});
