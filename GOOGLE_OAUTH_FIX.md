# Google OAuth Configuration Fix Guide

## Problem
Google OAuth is showing "Error 401: invalid_client" when users try to sign in with Google.

## Root Cause
The redirect URIs in Google Cloud Console don't match what NextAuth.js is sending, or the OAuth client configuration is incorrect.

## Solution Steps

### 1. Google Cloud Console Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to "APIs & Services" > "Credentials"
4. Find your OAuth 2.0 Client ID and click the edit icon

### 2. Configure Authorized JavaScript Origins
Add these URLs to "Authorized JavaScript origins":
```
http://localhost:3000
https://yourdomain.com (for production)
```

### 3. Configure Authorized Redirect URIs
Add these EXACT URLs to "Authorized redirect URIs":
```
http://localhost:3000/api/auth/callback/google
https://yourdomain.com/api/auth/callback/google (for production)
```

**IMPORTANT**: The redirect URI must be EXACTLY `http://localhost:3000/api/auth/callback/google` for NextAuth.js

### 4. Environment Variables Check
Ensure your `.env.local` has:
```env
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your_client_id_here"
GOOGLE_CLIENT_SECRET="your_client_secret_here"
```

### 5. NextAuth Configuration
Your NextAuth config should be simple:
```typescript
GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
})
```

**DO NOT** manually specify redirect_uri in the authorization params - NextAuth handles this automatically.

### 6. Common Issues to Check

1. **Trailing Slashes**: Make sure redirect URIs don't have trailing slashes
2. **HTTP vs HTTPS**: Use HTTP for localhost, HTTPS for production
3. **Port Numbers**: Ensure the port matches (3000 for development)
4. **Client ID/Secret**: Double-check these haven't changed in Google Cloud Console
5. **OAuth Consent Screen**: Ensure it's properly configured and published

### 7. Testing

1. Clear browser cache and cookies
2. Try in incognito mode
3. Check browser developer tools for any console errors
4. Verify the redirect URL in the network tab matches what's configured

### 8. Production Deployment

For production, you'll need to:
1. Add your production domain to both JavaScript origins and redirect URIs
2. Set `NEXTAUTH_URL` to your production URL
3. Ensure your OAuth consent screen is verified and published

## Expected Behavior After Fix

When users click "Sign in with Google":
1. They should be redirected to Google's OAuth consent screen
2. They can select their Google account
3. They're redirected back to your app and automatically signed in
4. No error messages should appear

## Verification

To verify the fix is working:
1. Click "Sign in with Google" on your app
2. You should see Google's account selection screen
3. After selecting an account, you should be redirected back and signed in
4. Check that the user session is properly created

---

**Note**: Changes to Google Cloud Console can take a few minutes to propagate. If it doesn't work immediately, wait 5-10 minutes and try again.