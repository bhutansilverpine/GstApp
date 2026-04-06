# Silverpine Ledger - Troubleshooting Guide

Common issues and solutions for Silverpine Ledger SaaS application.

## Table of Contents
1. [Installation Issues](#installation-issues)
2. [Database Issues](#database-issues)
3. [Authentication Issues](#authentication-issues)
4. [Build & Deployment Issues](#build--deployment-issues)
5. [Performance Issues](#performance-issues)
6. [Feature-Specific Issues](#feature-specific-issues)
7. [External Service Issues](#external-service-issues)
8. [Debugging Tips](#debugging-tips)

## Installation Issues

### Issue: npm install fails with dependency conflicts

**Symptoms:**
```
npm ERR! peer dep missing: ...
npm ERR! code ERESOLVE
```

**Solutions:**
```bash
# Solution 1: Use legacy peer deps
npm install --legacy-peer-deps

# Solution 2: Clear npm cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Solution 3: Force specific versions
npm install --force
```

### Issue: Port 3000 already in use

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solutions:**
```bash
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use different port
PORT=3001 npm run dev
```

### Issue: Module not found errors

**Symptoms:**
```
Error: Cannot find module 'xxx'
Module not found: Can't resolve 'xxx'
```

**Solutions:**
```bash
# Clear all caches
rm -rf .next node_modules
npm install

# Rebuild TypeScript
npm run build

# Check imports are correct
# Verify file paths and extensions
```

## Database Issues

### Issue: Database connection failed

**Symptoms:**
```
Error: connect ECONNREFUSED
Connection refused at localhost:5432
```

**Solutions:**

1. **Verify DATABASE_URL:**
```bash
echo $DATABASE_URL
# Should be: postgresql://user:password@host:5432/dbname
```

2. **Test connection manually:**
```bash
psql $DATABASE_URL
# or
npm run db:health
```

3. **Check database is running:**
```bash
# macOS
brew services list

# Linux
systemctl status postgresql

# Windows
# Check Services app for PostgreSQL
```

4. **Verify network connectivity:**
```bash
ping your-database-host
telnet your-database-host 5432
```

### Issue: Migration fails

**Symptoms:**
```
Error: Migration failed
Table already exists
```

**Solutions:**

1. **Reset database (dev only):**
```bash
npm run db:reset
```

2. **Manual migration:**
```bash
# Check migration status
npm run db:generate

# Push schema forcefully
npm run db:push -- --force
```

3. **Check for schema conflicts:**
```bash
npm run db:studio
# Review existing tables
```

### Issue: Drizzle Studio won't open

**Symptoms:**
```
Error: Cannot connect to database
```

**Solutions:**
```bash
# Ensure DATABASE_URL is set
echo $DATABASE_URL

# Check database credentials
# Verify user has proper permissions

# Try alternative port
PORT=4984 npm run db:studio
```

### Issue: Slow database queries

**Symptoms:**
- API requests take >2 seconds
- Dashboard loads slowly

**Solutions:**

1. **Add indexes:**
```typescript
// In your migration file
await db.execute(`
  CREATE INDEX IF NOT EXISTS idx_transactions_date
  ON ledger.transactions(date DESC);
`);
```

2. **Use query optimization:**
```typescript
// Bad: Fetches all data
const all = await db.select().from(transactions);

// Good: Specific fields and limits
const recent = await db.select()
  .from(transactions)
  .limit(10)
  .orderBy(desc(transactions.date));
```

3. **Enable connection pooling:**
```javascript
// In DATABASE_URL
// Add: ?pgbouncer=true
DATABASE_URL="postgresql://user:pass@host:5432/db?pgbouncer=true"
```

## Authentication Issues

### Issue: Clerk authentication not working

**Symptoms:**
```
Error: Clerk: not authenticated
Redirect loop
```

**Solutions:**

1. **Verify environment variables:**
```bash
# Check Clerk keys
echo $NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
echo $CLERK_SECRET_KEY

# Should start with pk_test_ and sk_test_
```

2. **Check middleware configuration:**
```typescript
// middleware.ts - ensure this is correct
import { authMiddleware } from '@clerk/nextjs/server';

export default authMiddleware({
  publicRoutes: ['/sign-in', '/sign-up', '/api/webhooks'],
});
```

3. **Clear browser data:**
- Clear cookies and cache
- Try incognito mode
- Check browser console for errors

### Issue: Session expires too quickly

**Symptoms:**
- User logged out repeatedly
- Session lost on refresh

**Solutions:**

1. **Check Clerk dashboard settings:**
- Go to Clerk Dashboard > Sessions
- Adjust session duration
- Enable "Remember Me" feature

2. **Update Clerk configuration:**
```typescript
// In your Clerk provider
<ClerkProvider
  afterSignInUrl="/dashboard"
  afterSignUpUrl="/dashboard"
  signInForceRedirectUrl={false}
  signUpForceRedirectUrl={false}
>
```

## Build & Deployment Issues

### Issue: Build fails with TypeScript errors

**Symptoms:**
```
TS2345: Argument of type 'string' is not assignable to parameter of type 'number'
```

**Solutions:**

1. **Run type checker locally:**
```bash
npm run type-check
```

2. **Fix type errors:**
```typescript
// Add proper types
interface UserData {
  name: string;
  age: number;
}

const processData = (data: UserData) => {
  // ...
};
```

3. **Use ts-ignore sparingly:**
```typescript
// @ts-ignore - only as last resort
const result = riskyOperation();
```

### Issue: Vercel deployment fails

**Symptoms:**
```
Error: Build failed with exit code 1
Module not found: Can't resolve 'xxx'
```

**Solutions:**

1. **Check build logs:**
```bash
# Local build test
npm run build

# Should succeed before deploying
```

2. **Verify environment variables:**
- Go to Vercel Dashboard > Settings > Environment Variables
- Ensure all required variables are set
- Check for typos in variable names

3. **Check Node.js version:**
```bash
# Ensure compatible Node version
node --version  # Should be 18+

# Add to package.json if needed
"engines": {
  "node": ">=18.0.0"
}
```

### Issue: Production build is slow

**Symptoms:**
- Build takes >10 minutes
- Frequent timeouts

**Solutions:**

1. **Optimize build:**
```json
// next.config.js
module.exports = {
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};
```

2. **Enable caching:**
```json
// vercel.json
{
  "build": {
    "env": {
      "NEXT_TELEMETRY_DISABLED": "1"
    }
  }
}
```

3. **Reduce bundle size:**
```bash
# Analyze bundle
npm run analyze

# Remove unused dependencies
npm uninstall <unused-package>
```

## Performance Issues

### Issue: Page load is slow

**Symptoms:**
- First Contentful Paint >2s
- Large Time to Interactive

**Solutions:**

1. **Enable dynamic imports:**
```typescript
// Instead of
import { HeavyComponent } from './HeavyComponent';

// Use
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Spinner />,
});
```

2. **Optimize images:**
```typescript
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={100}
  priority // For above-fold images
/>
```

3. **Use caching:**
```typescript
// In API routes
export async function GET() {
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30'
    }
  });
}
```

### Issue: Memory leaks

**Symptoms:**
- Memory usage increases over time
- Application becomes unresponsive

**Solutions:**

1. **Find memory leaks:**
```bash
# Run with --inspect flag
node --inspect node_modules/.bin/next dev

# Open Chrome DevTools > Memory
# Take heap snapshots
```

2. **Clean up subscriptions:**
```typescript
useEffect(() => {
  const subscription = someObservable.subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, []);
```

3. **Avoid closures:**
```typescript
// Bad: Creates new function on each render
<button onClick={() => handleClick(id)} />

// Good: Uses useCallback
const handleClickMemoized = useCallback(() => {
  handleClick(id);
}, [id]);
```

## Feature-Specific Issues

### Issue: Bank statement upload fails

**Symptoms:**
```
Error: Failed to parse PDF
File size too large
```

**Solutions:**

1. **Check file size:**
```typescript
// Increase upload limit if needed
// In next.config.js
module.exports = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};
```

2. **Verify PDF format:**
```bash
# Test PDF parsing locally
node scripts/test-pdf.js path/to/statement.pdf
```

3. **Check file permissions:**
```bash
# Ensure temp directory is writable
chmod 755 /tmp
```

### Issue: Receipt scanning returns poor results

**Symptoms:**
- Low confidence scores
- Incorrect data extraction

**Solutions:**

1. **Improve image quality:**
```typescript
// Preprocess image
const processedImage = await sharp(image)
  .resize(1024, 1024, { fit: 'inside' })
  .normalize()
  .toBuffer();
```

2. **Check Gemini API quota:**
```bash
# Verify API key has quota
curl https://generativelanguage.googleapis.com/v1beta/models \
  -H "x-goog-api-key: $GEMINI_API_KEY"
```

3. **Add error handling:**
```typescript
if (confidence < 0.7) {
  return {
    error: 'Low confidence - please verify data',
    data: extractedData,
  };
}
```

### Issue: Invoice generation fails

**Symptoms:**
```
Error: Failed to generate PDF
Invalid template
```

**Solutions:**

1. **Check pdf-lib installation:**
```bash
npm list pdf-lib
# Should be latest version
```

2. **Validate template:**
```typescript
// Test template with sample data
const testPdf = await generateInvoice({
  invoiceNumber: 'TEST-001',
  items: [...],
  // ... minimal required fields
});
```

3. **Check font files:**
```bash
# Ensure fonts are in public/fonts/
ls public/fonts/
```

## External Service Issues

### Issue: Supabase connection fails

**Symptoms:**
```
Error: Invalid API key
Connection timeout
```

**Solutions:**

1. **Verify credentials:**
```bash
# Check Supabase URL and keys
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

2. **Check service status:**
```bash
# Visit Supabase status page
# https://status.supabase.com/
```

3. **Enable connection pooling:**
```javascript
// Use Supabase connection pooler
const supabaseUrl = `${SUPABASE_URL}:6543`;
```

### Issue: Payment gateway errors

**Symptoms:**
```
Error: Payment failed
Invalid signature
```

**Solutions:**

1. **Verify payment credentials:**
```bash
echo $RMA_PAYMENT_API_KEY
echo $RMA_PAYMENT_SECRET
```

2. **Test webhooks:**
```bash
# Use ngrok for local testing
ngrok http 3000

# Update payment gateway webhook URL
```

3. **Check payment logs:**
```typescript
// Add detailed logging
console.log('Payment request:', {
  amount,
  currency,
  timestamp: new Date().toISOString(),
});
```

## Debugging Tips

### Enable Debug Logging

```typescript
// In lib/debug.ts
export const DEBUG = process.env.NODE_ENV === 'development';

export function logDebug(...args: any[]) {
  if (DEBUG) {
    console.log('[DEBUG]', ...args);
  }
}

// Usage
logDebug('User data:', userData);
```

### Use Chrome DevTools

1. **Network Tab:**
   - Monitor API requests
   - Check response times
   - Verify status codes

2. **Console Tab:**
   - Check for JavaScript errors
   - Monitor console logs
   - Use `debugger` statements

3. **React DevTools:**
   - Inspect component state
   - Monitor props
   - Track re-renders

### Database Debugging

```bash
# Enable query logging
DATABASE_URL="postgresql://user:pass@host:5432/db?pgbouncer=true&logging=true"

# Use Drizzle Studio
npm run db:studio

# Query database directly
psql $DATABASE_URL
```

### Performance Profiling

```bash
# Analyze bundle size
npm run analyze

# Profile Node.js
node --prof node_modules/.bin/next dev

# Check Vercel Analytics
# Deploy and view metrics in Vercel Dashboard
```

---

## Getting Additional Help

### Check Logs

1. **Application Logs:**
```bash
# Check Next.js logs
npm run dev 2>&1 | tee dev.log

# Check production logs
vercel logs
```

2. **Database Logs:**
- Supabase Dashboard > Database > Logs
- Check for slow queries
- Look for connection errors

### Community Resources

- [Clerk Community](https://clerk.com/community)
- [Supabase Discord](https://discord.gg/supabase)
- [Next.js GitHub Discussions](https://github.com/vercel/next.js/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/silverpine-ledger)

### Reporting Issues

When reporting issues, include:

1. **Environment:**
   - OS: macOS/Linux/Windows
   - Node version: `node --version`
   - npm version: `npm --version`

2. **Error Messages:**
   - Complete error stack trace
   - Screenshots if applicable

3. **Steps to Reproduce:**
   - Detailed steps
   - Expected vs actual behavior

4. **Additional Context:**
   - Recent changes
   - Configuration files
   - Relevant code snippets

---

**Remember:** Most issues can be resolved by:
1. Reading error messages carefully
2. Checking environment variables
3. Clearing caches and restarting
4. Updating dependencies
5. Checking service status pages