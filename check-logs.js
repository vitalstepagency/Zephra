// Simple script to check if we can see the debug logs
console.log('Check the Vercel deployment logs at https://vercel.com/vitalstepagency/zephra/functions');
console.log('Look for "Auth Error Details:" in the logs after running the test.');
console.log('\nThe error from the original log shows:');
console.log('"originalError": {"code": "email_exists", "name": "AuthApiError", "status": 422, "__isAuthError": true}');
console.log('\nSo the error.code should be "email_exists" - let me check if our condition is working...');