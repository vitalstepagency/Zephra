const fetch = require('node-fetch');

// Test the signup endpoint with an existing email
async function testEmailExists() {
  const testData = {
    email: 'evensendylan@gmail.com', // This email already exists
    password: 'StrongPassword123!@#$%^&*()',
    firstName: 'Test',
    lastName: 'User',
    phone: '+1234567890',
    company: 'Test Company',
    planId: 'basic',
    stripeCustomerId: 'cus_test123'
  };

  try {
    console.log('Testing signup with existing email...');
    
    const response = await fetch('https://www.joinzephra.ai/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (response.status === 409) {
      console.log('✅ SUCCESS: Email exists error handled correctly!');
    } else {
      console.log('❌ UNEXPECTED: Expected 409 status for existing email');
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

testEmailExists();