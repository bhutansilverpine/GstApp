# Silverpine Ledger - Deployment Guide

Complete deployment guide for Silverpine Ledger SaaS application on Vercel.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Vercel Deployment](#vercel-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [Post-Deployment Tasks](#post-deployment-tasks)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

- [ ] Node.js 18+ installed locally
- [ ] Git repository with code pushed to GitHub/GitLab
- [ ] Vercel account (https://vercel.com)
- [ ] Supabase account (https://supabase.com)
- [ ] Clerk account (https://clerk.com)
- [ ] Google Cloud account (for Gemini AI)
- [ ] RMA Payment Gateway account
- [ ] Domain name (optional, for custom domain)

## Pre-Deployment Checklist

### 1. Code Preparation
```bash
# Test the build locally
npm run build

# Run tests (if available)
npm test

# Check for TypeScript errors
npm run lint

# Verify environment variables are properly defined
cp .env.local.example .env.local
# Fill in all required values
```

### 2. Database Preparation
```bash
# Generate database migrations
npm run db:generate

# Push schema to database
npm run db:push

# Seed database with initial data
npm run db:seed

# Verify database connection
npm run db:health
```

### 3. Security Check
- [ ] No hardcoded API keys or secrets
- [ ] `.env.local` is in `.gitignore`
- [ ] No sensitive data in client-side code
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Authentication flow tested

### 4. Performance Check
- [ ] Images optimized
- [ ] Bundle size analyzed
- [ ] Lazy loading implemented
- [ ] Database queries optimized
- [ ] Caching strategy in place

## Vercel Deployment

### Step 1: Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your Git repository
4. Configure project settings

### Step 2: Configure Build Settings

Vercel will automatically detect Next.js, but verify these settings:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install"
}
```

### Step 3: Set Environment Variables

Add these in Vercel Project Settings > Environment Variables:

#### Required Variables
```bash
# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_*
CLERK_SECRET_KEY=sk_live_*
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# AI Services
GEMINI_API_KEY=your-gemini-api-key

# Payment Gateway
RMA_PAYMENT_API_KEY=rma_live_*
RMA_PAYMENT_SECRET=rma_secret_*
RMA_MERCHANT_ID=merchant_*
NEXT_PUBLIC_RMA_MERCHANT_ID=merchant_*

# Application
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_APP_NAME=Silverpine Ledger
NODE_ENV=production
```

#### Feature Flags
```bash
NEXT_PUBLIC_ENABLE_SIGN_UP=true
NEXT_PUBLIC_ENABLE_BANK_STATEMENT_UPLOAD=true
NEXT_PUBLIC_ENABLE_RECEIPT_SCAN=true
NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB=10
```

### Step 4: Deploy

1. Click "Deploy"
2. Wait for build to complete (~2-3 minutes)
3. Verify deployment URL works
4. Test critical functionality

### Step 5: Custom Domain (Optional)

1. Go to Settings > Domains
2. Add your custom domain
3. Configure DNS records
4. Wait for SSL certificate provisioning

## Environment Configuration

### Production vs Development

| Variable | Development | Production |
|----------|-------------|------------|
| `NODE_ENV` | `development` | `production` |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | `https://your-domain.com` |
| Clerk Keys | Test keys (`pk_test_*`) | Live keys (`pk_live_*`) |
| Payment Gateway | Test mode | Live mode |
| Database | Local/staging | Production instance |

### Environment-Specific Features

#### Development
- Detailed error messages
- Hot reload enabled
- Debug logging
- Test payment mode

#### Production
- Minified bundles
- Error tracking enabled
- Optimized assets
- Live payment processing

## Database Setup

### 1. Supabase Production Database

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS ledger;

-- Set up Row Level Security
ALTER DEFAULT PRIVILEGES IN SCHEMA ledger
GRANT ALL ON TABLES TO service_role;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON ledger.users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON ledger.businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON ledger.transactions(date);
```

### 2. Migration Strategy

#### Option A: Direct Migrate (Recommended)
```bash
# On your local machine, targeting production database
DATABASE_URL="postgresql://production-db" npm run db:push
```

#### Option B: Migration Files
```bash
# Generate migration
npm run db:generate

# Apply to production
vercel env pull .env.production
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2)
npm run db:migrate
```

### 3. Database Backup

Enable automated backups in Supabase:
- Go to Database > Backups
- Enable daily backups
- Set retention period (7-30 days)
- Test restore procedure

## Post-Deployment Tasks

### 1. Initial Setup

```bash
# Run database health check
curl https://your-app.vercel.app/api/health

# Seed initial data (if needed)
npm run db:seed

# Create admin user
# Sign up via the application and manually promote to admin in database
```

### 2. Verification Tests

#### Authentication
- [ ] User can sign up
- [ ] User can sign in
- [ ] Session persists across refreshes
- [ ] Sign out works correctly

#### Core Features
- [ ] Dashboard loads
- [ ] Can create business
- [ ] Can add invoice
- [ ] Bank statement upload works
- [ ] Receipt scanning works
- [ ] Reports generate correctly

#### Payments
- [ ] Payment page loads
- [ ] Test transaction succeeds
- [ ] Webhooks receive updates
- [ ] Invoice generation works

### 3. Monitoring Setup

#### Error Tracking
- Set up [Sentry](https://sentry.io) or similar
- Add to project:
  ```bash
  npm install @sentry/nextjs
  npx @sentry/wizard@latest -i nextjs
  ```

#### Analytics
- Add Google Analytics or Plausible
- Configure in `app/layout.tsx`

#### Performance Monitoring
- Enable Vercel Analytics:
  ```bash
  npm install @vercel/analytics
  ```
- Add to `app/layout.tsx`:
  ```tsx
  import { Analytics } from '@vercel/analytics/react';
  ```

### 4. Security Hardening

#### Headers
Verify security headers in `vercel.json` are applied:
```bash
curl -I https://your-app.vercel.app
```

#### Rate Limiting
Implement API rate limiting:
```typescript
// middleware.ts
import { Ratelimit } from "@unkey/ratelimit";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});
```

#### CORS Configuration
```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE' },
        ],
      },
    ];
  },
};
```

## Monitoring & Maintenance

### Daily Tasks
- Check error tracking dashboard
- Review performance metrics
- Verify backup completion
- Monitor payment transactions

### Weekly Tasks
- Review usage statistics
- Check database storage
- Analyze slow queries
- Update dependencies

### Monthly Tasks
- Security audit
- Performance review
- Backup restoration test
- Cost analysis
- Feature usage review

### Scaling Checklist

#### When to Scale Up
- CPU usage > 80% for sustained periods
- Memory usage > 80%
- Database connection pool exhausted
- Response time > 2 seconds

#### Scaling Options
1. **Vercel Pro Plan**
   - Higher bandwidth limits
   - Faster builds
   - Team collaboration

2. **Database Scaling**
   - Enable connection pooling
   - Add read replicas
   - Optimize queries

3. **CDN Optimization**
   - Image optimization
   - Static asset caching
   - Edge functions

## Troubleshooting

### Build Failures

#### Issue: Build timeout
**Solution:**
```json
// vercel.json
{
  "build": {
    "timeout": 600000  // 10 minutes
  }
}
```

#### Issue: Module not found
**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
```

### Runtime Errors

#### Issue: Database connection failed
**Solution:**
1. Check DATABASE_URL is correct
2. Verify IP whitelist includes Vercel IPs
3. Test connection locally:
   ```bash
   psql $DATABASE_URL
   ```

#### Issue: API returns 500
**Solution:**
1. Check Vercel function logs
2. Review error tracking
3. Test locally with production env:
   ```bash
   vercel env pull .env.production
   vercel dev
   ```

### Performance Issues

#### Issue: Slow page loads
**Solution:**
1. Analyze bundle size:
   ```bash
   npm run build -- --analyze
   ```
2. Implement code splitting
3. Optimize images
4. Enable caching

#### Issue: Database slow queries
**Solution:**
1. Enable query logging
2. Add appropriate indexes
3. Use connection pooling
4. Consider read replicas

## Rollback Procedure

If critical issues occur:

1. **Immediate Rollback**
   ```bash
   # Revert to previous deployment
   vercel rollback
   ```

2. **Database Rollback**
   ```bash
   # Restore from backup
   # In Supabase Dashboard > Database > Backups > Restore
   ```

3. **Verify Rollback**
   - Test core functionality
   - Check error rates
   - Monitor performance

## Cost Optimization

### Vercel Costs
- Monitor bandwidth usage
- Optimize image sizes
- Implement caching
- Use Edge Functions strategically

### Database Costs
- Monitor storage usage
- Implement data retention policies
- Archive old data
- Optimize query performance

### Third-Party Services
- Review API usage limits
- Implement caching where possible
- Batch API requests
- Use cost-effective alternatives

## Support & Resources

### Documentation
- [Vercel Docs](https://vercel.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Clerk Docs](https://clerk.com/docs)

### Community
- [Vercel Discord](https://vercel.com/discord)
- [Next.js GitHub](https://github.com/vercel/next.js)
- [Stack Overflow](https://stackoverflow.com)

### Emergency Contacts
- Set up on-call rotation
- Document escalation procedures
- Maintain incident response plan

---

**Deployment Checklist Summary:**

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Production API keys configured
- [ ] Build succeeds without errors
- [ ] Core functionality tested
- [ ] Monitoring and analytics set up
- [ ] Backup procedures verified
- [ ] Rollback procedure documented
- [ ] Team trained on maintenance
- [ ] Support documentation available

**Next Steps:** After successful deployment, monitor the application for 24-48 hours before promoting to users.