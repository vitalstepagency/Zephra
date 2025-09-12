# 🛡️ ZEPHRA BULLETPROOF SECURITY CHECKLIST

## 🎯 IMMEDIATE ACTIONS (Do These First)

### 1. Deploy RLS Policies
```bash
# Run the deployment script
node scripts/deploy-rls-policies.js

# Verify deployment
node scripts/deploy-rls-policies.js --verify-only
```

### 2. Test Security Implementation
```bash
# Run comprehensive security tests
node scripts/security-test.js
```

---

## 🗄️ SUPABASE SECURITY HARDENING

### Database Settings

#### A. Authentication & JWT
1. **Go to**: Supabase Dashboard → Authentication → Settings
2. **JWT Expiry**: Set to `3600` seconds (1 hour)
3. **Refresh Token Rotation**: ✅ Enable
4. **Double Confirm Password**: ✅ Enable
5. **Enable Email Confirmations**: ✅ Enable
6. **Secure Email Change**: ✅ Enable

#### B. API Settings
1. **Go to**: Supabase Dashboard → Settings → API
2. **Max Rows**: Set to `1000` (prevent large data dumps)
3. **Enable RLS**: ✅ Verify enabled
4. **DB Schema**: Set to `public` only

#### C. Database Security
1. **Go to**: Supabase Dashboard → Settings → Database
2. **Connection Pooling**: ✅ Enable (if available)
3. **SSL Enforcement**: ✅ Enable
4. **Connection Limit**: Set to reasonable limit (e.g., 100)

### Row Level Security (RLS)

#### Verify RLS Status
1. **Go to**: Supabase Dashboard → Table Editor
2. **For each table**, verify:
   - ✅ RLS is enabled
   - ✅ Policies exist
   - ✅ Policies are restrictive (not allowing all)

#### Critical Tables to Check
- `users` - Should only allow users to see their own data
- `organizations` - Should only allow organization members
- `campaigns` - Should only allow organization members
- `funnels` - Should only allow organization members
- `contacts` - Should only allow organization members
- `analytics_events` - Should only allow organization members

### Backup & Recovery

#### Enable Point-in-Time Recovery
1. **Go to**: Supabase Dashboard → Settings → Database
2. **Point-in-time Recovery**: ✅ Enable (if available on your plan)
3. **Backup Schedule**: Set to daily

#### Manual Backup
```bash
# Create manual backup
node scripts/deploy-rls-policies.js --backup-only
```

---

## 🔐 VERCEL SECURITY HARDENING

### Environment Variables

#### A. Production Environment
1. **Go to**: Vercel Dashboard → Your Project → Settings → Environment Variables
2. **Verify these are set for Production**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_key
   NEXTAUTH_SECRET=your_32_char_secret
   NEXTAUTH_URL=https://yourdomain.com
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   RATE_LIMIT_MAX=100
   RATE_LIMIT_WINDOW=900000
   ```

#### B. Security Headers
1. **Create/Update**: `vercel.json` in project root:
   ```json
   {
     "headers": [
       {
         "source": "/(.*)",
         "headers": [
           {
             "key": "X-Frame-Options",
             "value": "DENY"
           },
           {
             "key": "X-Content-Type-Options",
             "value": "nosniff"
           },
           {
             "key": "Referrer-Policy",
             "value": "strict-origin-when-cross-origin"
           },
           {
             "key": "Permissions-Policy",
             "value": "camera=(), microphone=(), geolocation=()"
           }
         ]
       }
     ]
   }
   ```

### Deployment Protection

#### A. Branch Protection
1. **Go to**: Vercel Dashboard → Your Project → Settings → Git
2. **Production Branch**: Set to `main` only
3. **Deploy Hooks**: ✅ Disable if not needed

#### B. Domain Security
1. **Go to**: Vercel Dashboard → Your Project → Settings → Domains
2. **Custom Domain**: Add your domain
3. **SSL Certificate**: ✅ Verify auto-renewal enabled
4. **Redirect www**: ✅ Enable if desired

---

## 💳 STRIPE SECURITY HARDENING

### API Keys Management

#### A. Key Rotation
1. **Go to**: Stripe Dashboard → Developers → API Keys
2. **Publishable Key**: ✅ Verify starts with `pk_live_` (production)
3. **Secret Key**: ✅ Verify starts with `sk_live_` (production)
4. **Restricted Keys**: Consider using for enhanced security

#### B. Webhook Security
1. **Go to**: Stripe Dashboard → Developers → Webhooks
2. **Endpoint URL**: `https://yourdomain.com/api/stripe/webhook`
3. **Events**: Select only necessary events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. **Webhook Secret**: ✅ Copy to environment variables

### Fraud Prevention

#### A. Radar Rules
1. **Go to**: Stripe Dashboard → Fraud & Risk → Rules
2. **Enable recommended rules**:
   - Block if CVC check fails
   - Block if postal code check fails
   - Block payments from high-risk countries (if applicable)

#### B. 3D Secure
1. **Go to**: Stripe Dashboard → Settings → Payment Methods
2. **3D Secure**: ✅ Enable for enhanced authentication

---

## 🔧 GITHUB REPOSITORY SECURITY

### Repository Settings

#### A. Branch Protection
1. **Go to**: GitHub → Your Repo → Settings → Branches
2. **Add rule for `main` branch**:
   - ✅ Require pull request reviews
   - ✅ Require status checks
   - ✅ Require branches to be up to date
   - ✅ Include administrators

#### B. Security Alerts
1. **Go to**: GitHub → Your Repo → Settings → Security & analysis
2. **Enable**:
   - ✅ Dependency graph
   - ✅ Dependabot alerts
   - ✅ Dependabot security updates
   - ✅ Secret scanning

### Secrets Management

#### A. Repository Secrets
1. **Go to**: GitHub → Your Repo → Settings → Secrets and variables → Actions
2. **Add secrets** (for CI/CD):
   ```
   VERCEL_TOKEN=your_vercel_token
   SUPABASE_ACCESS_TOKEN=your_supabase_token
   ```

#### B. .gitignore Verification
```bash
# Verify these are in .gitignore
.env.local
.env.production
*.log
node_modules/
.next/
```

---

## 📊 MONITORING & ALERTING

### Supabase Monitoring

#### A. Database Monitoring
1. **Go to**: Supabase Dashboard → Reports
2. **Monitor**:
   - Database size growth
   - API requests per day
   - Authentication events
   - Error rates

#### B. Set Up Alerts (if available)
1. **Database size** > 80% of limit
2. **API requests** > daily limit
3. **Failed authentication** attempts spike

### Vercel Monitoring

#### A. Analytics
1. **Go to**: Vercel Dashboard → Your Project → Analytics
2. **Monitor**:
   - Page load times
   - Error rates
   - Traffic patterns

#### B. Function Logs
1. **Go to**: Vercel Dashboard → Your Project → Functions
2. **Monitor API endpoints** for:
   - Error rates
   - Response times
   - Unusual traffic patterns

---

## 🚨 EMERGENCY RESPONSE PLAN

### Security Incident Response

#### Immediate Actions (< 5 minutes)
1. **Disable API access**:
   ```bash
   # Rotate Supabase service key immediately
   # Update environment variables in Vercel
   ```

2. **Check for data breach**:
   ```sql
   -- Run in Supabase SQL Editor
   SELECT * FROM security_audit_log 
   WHERE created_at > NOW() - INTERVAL '24 hours'
   ORDER BY created_at DESC;
   ```

3. **Block suspicious IPs** (if identified):
   - Update rate limiting rules
   - Contact Vercel support if needed

#### Investigation (< 30 minutes)
1. **Review logs**:
   - Vercel function logs
   - Supabase auth logs
   - Stripe webhook logs

2. **Check user accounts**:
   ```sql
   -- Check for suspicious user activity
   SELECT * FROM users 
   WHERE created_at > NOW() - INTERVAL '24 hours'
   OR updated_at > NOW() - INTERVAL '24 hours';
   ```

#### Recovery Actions
1. **Restore from backup** (if needed)
2. **Update all API keys**
3. **Force user re-authentication**
4. **Deploy security patches**

---

## ✅ WEEKLY SECURITY CHECKLIST

### Every Monday
- [ ] Review Supabase auth logs
- [ ] Check Vercel function error rates
- [ ] Review Stripe transaction patterns
- [ ] Update dependencies if needed
- [ ] Run security test suite

### Every Month
- [ ] Rotate API keys
- [ ] Review user access permissions
- [ ] Update security policies if needed
- [ ] Backup security configurations
- [ ] Review and update this checklist

---

## 🎯 SECURITY SCORE TARGET

**Goal**: Maintain 95%+ security score

**Run this weekly**:
```bash
node scripts/security-test.js
```

**If score drops below 90%**:
1. Identify failed tests
2. Fix issues immediately
3. Re-run tests
4. Document changes

---

## 📚 ADDITIONAL RESOURCES

- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [Vercel Security Headers](https://vercel.com/docs/concepts/edge-network/headers)
- [Stripe Security Guide](https://stripe.com/docs/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)

---

## 🆘 EMERGENCY CONTACTS

- **Supabase Support**: [Supabase Dashboard → Support]
- **Vercel Support**: [Vercel Dashboard → Help]
- **Stripe Support**: [Stripe Dashboard → Support]
- **Your Security Team**: [Add your contact info]

---

*Last Updated: [Current Date]*
*Next Review: [Add 1 month to current date]*