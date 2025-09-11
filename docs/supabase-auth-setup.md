# Supabase Authentication Setup

## Google OAuth Configuration

To complete the authentication setup, you need to configure Google OAuth in your Supabase dashboard:

### 1. Access Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `zephra-ai-marketing`
3. Navigate to **Authentication** > **Providers**

### 2. Configure Google Provider
1. Find **Google** in the providers list
2. Enable the Google provider
3. Add your Google OAuth credentials:
   - **Client ID**: Your Google OAuth Client ID from `.env.local`
   - **Client Secret**: Your Google OAuth Client Secret from `.env.local`

### 3. Configure Redirect URLs
Add these redirect URLs in your Google Cloud Console:
- **Development**: `https://tuxvkejwgqoypcizhnxz.supabase.co/auth/v1/callback`
- **Production**: `https://your-domain.com/auth/v1/callback` (when deployed)

### 4. Site URL Configuration
In Supabase Authentication settings:
- **Site URL**: `http://localhost:3000` (development)
- **Redirect URLs**: 
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/**` (for development)

### 5. Additional Security Settings
- Enable **Email Confirmations** if desired
- Configure **Session Settings** as needed
- Set up **Rate Limiting** for production

## Testing Authentication

Once configured:
1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:3000`
3. Click "Sign in with Google"
4. Complete the OAuth flow
5. Verify user creation in Supabase Dashboard > Authentication > Users

## Environment Variables Required

Ensure these are set in your `.env.local`:
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-generated-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```