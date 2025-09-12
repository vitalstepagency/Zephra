# Production Deployment Guide

This guide covers the secure deployment of the Copy Trade application to Vercel with comprehensive monitoring and security measures.

## Prerequisites

- Vercel account with Pro plan (recommended for production)
- Stripe account with live API keys
- Supabase project configured
- Domain name (optional but recommended)

## Environment Variables

Copy `.env.example` to `.env.local` and configure all required variables:

### Required Variables
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# Stripe
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Security
NEXTAUTH_SECRET=your-nextauth-secret-32-chars-min
NEXTAUTH_URL=https://your-domain.com
ENCRYPTION_KEY=your-256-bit-encryption-key
JWT_SECRET=your-jwt-secret-key
```

### Optional Monitoring Variables
```bash
# Monitoring & Alerting
SENTRY_DSN=https://your-sentry-dsn
LOGTAIL_TOKEN=your-logtail-token
SLACK_WEBHOOK_URL=https://hooks.slack.com/...

# Rate Limiting (if using Redis)
REDIS_URL=redis://localhost:6379
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

## Deployment Steps

### 1. Database Setup

1. Run the database schema:
   ```sql
   -- Execute the contents of supabase/schema.sql in your Supabase SQL editor
   ```

2. Enable Row Level Security (RLS) on all tables

3. Configure authentication providers in Supabase Auth settings

### 2. Stripe Configuration

1. **Create Products and Prices:**
   - Go to Stripe Dashboard > Products
   - Create your subscription tiers (Starter, Pro, Enterprise)
   - Note the price IDs for environment variables

2. **Configure Webhooks:**
   - Go to Stripe Dashboard > Webhooks
   - Add endpoint: `https://your-domain.com/api/webhooks/stripe`
   - Select events:
     - `checkout.session.completed`
     - `customer.created`
     - `customer.updated`
     - `customer.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `subscription.created`
     - `subscription.updated`
     - `subscription.deleted`
     - `payment_method.attached`
     - `setup_intent.succeeded`

3. **Test Webhook:**
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

### 3. Vercel Deployment

1. **Connect Repository:**
   ```bash
   vercel --prod
   ```

2. **Configure Environment Variables:**
   - Go to Vercel Dashboard > Project > Settings > Environment Variables
   - Add all required environment variables
   - Ensure `NODE_ENV=production` is set

3. **Configure Custom Domain (Optional):**
   - Go to Vercel Dashboard > Project > Settings > Domains
   - Add your custom domain
   - Configure DNS records as instructed

### 4. Security Configuration

1. **Enable Security Headers:**
   - The `vercel.json` file includes comprehensive security headers
   - Verify CSP settings match your requirements

2. **Configure Rate Limiting:**
   - Set up Redis instance (Upstash recommended)
   - Configure rate limiting environment variables

3. **SSL/TLS:**
   - Vercel provides automatic SSL certificates
   - Ensure HTTPS redirect is enabled

### 5. Monitoring Setup

1. **Error Tracking:**
   ```bash
   npm install @sentry/nextjs
   ```
   - Configure Sentry DSN in environment variables
   - Set up error boundaries in React components

2. **Log Management:**
   - Configure LogTail or similar service
   - Set up log aggregation and alerting

3. **Health Monitoring:**
   - Health check endpoint: `/api/health`
   - Set up uptime monitoring (Pingdom, UptimeRobot)

4. **Performance Monitoring:**
   - Enable Vercel Analytics
   - Configure Core Web Vitals tracking

## Post-Deployment Checklist

### Security Verification
- [ ] All environment variables are properly set
- [ ] Webhook signature verification is working
- [ ] Rate limiting is active
- [ ] Security headers are applied
- [ ] HTTPS is enforced
- [ ] Admin endpoints require authentication

### Functionality Testing
- [ ] User registration and authentication
- [ ] Subscription creation and management
- [ ] Payment processing
- [ ] Webhook event handling
- [ ] Admin dashboard access
- [ ] Health check endpoint

### Monitoring Verification
- [ ] Error tracking is capturing issues
- [ ] Logs are being collected
- [ ] Health checks are running
- [ ] Alerts are configured
- [ ] Performance metrics are tracked

## Maintenance

### Regular Tasks

1. **Security Updates:**
   - Update dependencies monthly
   - Review security audit logs weekly
   - Rotate API keys quarterly

2. **Performance Monitoring:**
   - Review Core Web Vitals monthly
   - Optimize slow API endpoints
   - Monitor database performance

3. **Backup Verification:**
   - Verify Supabase backups are working
   - Test disaster recovery procedures
   - Document recovery processes

### Scaling Considerations

1. **Database Scaling:**
   - Monitor Supabase usage and upgrade plan as needed
   - Consider read replicas for high traffic
   - Implement database connection pooling

2. **Application Scaling:**
   - Vercel automatically scales serverless functions
   - Monitor function execution times
   - Consider edge caching for static content

3. **Rate Limiting:**
   - Monitor rate limit hit rates
   - Adjust limits based on usage patterns
   - Consider implementing user-based rate limiting

## Troubleshooting

### Common Issues

1. **Webhook Failures:**
   - Check webhook signature verification
   - Verify endpoint URL is accessible
   - Review Stripe webhook logs

2. **Authentication Issues:**
   - Verify Supabase configuration
   - Check JWT secret configuration
   - Review auth provider settings

3. **Payment Processing:**
   - Verify Stripe API keys
   - Check webhook event handling
   - Review payment intent status

### Debug Commands

```bash
# Check deployment status
vercel ls

# View function logs
vercel logs

# Test webhook locally
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Run security audit
npm audit

# Check health endpoint
curl https://your-domain.com/api/health
```

## Support

For deployment issues:
1. Check Vercel deployment logs
2. Review application logs in monitoring dashboard
3. Verify all environment variables are set correctly
4. Test webhook endpoints with Stripe CLI
5. Check database connectivity and permissions

## Security Incident Response

1. **Immediate Actions:**
   - Rotate compromised API keys
   - Review security audit logs
   - Block suspicious IP addresses
   - Notify affected users if necessary

2. **Investigation:**
   - Analyze attack vectors
   - Review system logs
   - Document findings
   - Implement additional security measures

3. **Recovery:**
   - Restore from backups if necessary
   - Update security configurations
   - Monitor for continued threats
   - Conduct post-incident review