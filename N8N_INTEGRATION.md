# n8n Integration with Zephra

## Overview

This document outlines how Zephra integrates with n8n to provide AI chat functionality and store user knowledge in Supabase.

## Flow

1. **User Signup & Checkout**
   - User selects a plan and frequency
   - User creates an account
   - User completes payment via Stripe
   - After successful payment, user is redirected to payment verification

2. **Payment Verification**
   - System verifies payment status with Stripe
   - Upon successful verification, user is redirected to onboarding
   - Session is maintained through URL parameters

3. **Onboarding**
   - User completes business profile
   - User interacts with AI chat (powered by n8n)
   - AI chat stores knowledge in Supabase

## n8n Integration

### Configuration

The following environment variables are required for n8n integration:

```
N8N_WEBHOOK_URL=https://n8n.zephra.io/webhook/chat
N8N_API_KEY=your-n8n-api-key
```

### API Endpoint

The n8n webhook is accessed through the following API endpoint:

```
/api/chat/n8n-webhook
```

### Request Format

```json
{
  "message": "User's message",
  "businessName": "User's business name",
  "industry": "User's industry",
  "currentChallenges": "User's current challenges",
  "messageHistory": [
    { "content": "Previous message", "sender": "user|ai" }
  ]
}
```

### Response Format

```json
{
  "message": "AI response message",
  "suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
}
```

## Supabase Integration

Chat conversations are stored in the `chat_conversations` table in Supabase with the following structure:

- `user_message`: The message sent by the user
- `ai_response`: The response from the AI
- `business_name`: The user's business name
- `industry`: The user's industry
- `current_challenges`: The user's current challenges

## Fallback Mechanism

If the n8n webhook fails, the system falls back to local response generation to ensure uninterrupted user experience.

## Testing

To test the integration:

1. Start the development server: `npm run dev`
2. Go through the signup and checkout process
3. Complete payment verification
4. Proceed to onboarding
5. Interact with the AI chat in Step 3 of onboarding

## Troubleshooting

- Check browser console for errors
- Verify n8n webhook URL and API key in environment variables
- Ensure Supabase connection is working properly
- Check n8n workflow logs for any issues