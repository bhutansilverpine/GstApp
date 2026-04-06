# Silverpine Ledger - Setup Guide

Complete setup guide for developers joining the Silverpine Ledger project.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Running the Application](#running-the-application)
6. [Development Workflow](#development-workflow)
7. [Testing](#testing)
8. [Common Development Tasks](#common-development-tasks)

## Prerequisites

### Required Software
- **Node.js**: v18.0 or higher ([Download](https://nodejs.org/))
- **npm**: v8.0 or higher (comes with Node.js)
- **Git**: Latest version ([Download](https://git-scm.com/))
- **Code Editor**: VS Code with recommended extensions

### Recommended VS Code Extensions
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "mtxr.sqltools",
    "mtxr.sqltools-driver-pg",
    "humao.rest-client",
    "eamodio.gitlens"
  ]
}
```

### Optional Tools
- **Postman**: For API testing
- **DBeaver**: For database management
- **Drizzle Studio**: For database GUI (built-in)

## Initial Setup

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/your-org/silverpine-ledger.git
cd silverpine-ledger

# Or if using SSH
git clone git@github.com:your-org/silverpine-ledger.git
cd silverpine-ledger
```

### 2. Install Dependencies

```bash
# Install all dependencies
npm install

# Verify installation
npm list --depth=0
```

### 3. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.local.example .env.local

# Edit with your actual values
# Use your favorite editor or VS Code
code .env.local
```

### 4. Database Setup

#### Option A: Supabase (Recommended)
```bash
# Sign up at https://supabase.com
# Create a new project
# Get your credentials:
# - Project URL
# - Anon key
# - Service role key

# Update .env.local with Supabase credentials
```

#### Option B: Local PostgreSQL
```bash
# Install PostgreSQL
# On macOS: brew install postgresql
# On Windows: Download from https://www.postgresql.org/download/

# Create database
createdb silverpine_ledger

# Update DATABASE_URL in .env.local
# DATABASE_URL=postgresql://postgres:password@localhost:5432/silverpine_ledger
```

### 5. Initialize Database

```bash
# Generate database schema
npm run db:generate

# Push schema to database
npm run db:push

# Seed database with sample data
npm run db:seed

# Verify database connection
npm run db:health
```

## Environment Configuration

### Required Environment Variables

Create a `.env.local` file in the project root:

```bash
# ====================================================================
# AUTHENTICATION (Clerk)
# ====================================================================
# Get these from https://dashboard.clerk.com/
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxx

# Redirect URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# ====================================================================
# DATABASE (Supabase)
# ====================================================================
# Get these from https://supabase.com/dashboard
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxxxxxxxxxx

# Direct database connection
DATABASE_URL=postgresql://postgres:password@localhost:5432/silverpine_ledger

# ====================================================================
# AI SERVICES (Google Gemini)
# ====================================================================
# Get from https://makersuite.google.com/app/apikey
GEMINI_API_KEY=AIxxxxxxxxxxxxx

# ====================================================================
# PAYMENT GATEWAY (RMA)
# ====================================================================
# Get from your payment provider
RMA_PAYMENT_API_KEY=rma_test_xxxxxxxxxxxxxx
RMA_PAYMENT_SECRET=rma_secret_xxxxxxxxxxxxxx
RMA_MERCHANT_ID=merchant_xxxxxxxxxxxxxx
NEXT_PUBLIC_RMA_MERCHANT_ID=merchant_xxxxxxxxxxxxxx

# ====================================================================
# APPLICATION CONFIG
# ====================================================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Silverpine Ledger
NODE_ENV=development

# ====================================================================
# FEATURE FLAGS
# ====================================================================
NEXT_PUBLIC_ENABLE_SIGN_UP=true
NEXT_PUBLIC_ENABLE_BANK_STATEMENT_UPLOAD=true
NEXT_PUBLIC_ENABLE_RECEIPT_SCAN=true
NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB=10
```

### Getting API Keys

#### Clerk Authentication
1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a new application
3. Copy API Keys from "API Keys" section
4. Configure JWT templates in "JWT Templates"

#### Supabase Database
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Go to Settings > API
4. Copy URL, anon key, and service role key

#### Google Gemini AI
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key

#### RMA Payment Gateway
1. Sign up at RMA Payment Gateway
2. Get test credentials from dashboard
3. Configure webhook URLs

## Running the Application

### Development Mode

```bash
# Start development server
npm run dev

# The application will be available at:
# http://localhost:3000
```

### Production Build (Local)

```bash
# Build for production
npm run build

# Start production server
npm run start

# Or test production build locally
npm run test:deploy
```

### Database Studio

```bash
# Open Drizzle Studio (database GUI)
npm run db:studio

# Opens at http://localhost:4983
```

## Development Workflow

### Branch Strategy

```bash
# Main branches
main        # Production code
develop     # Development code

# Feature branches
feature/*   # New features
bugfix/*    # Bug fixes
hotfix/*    # Urgent production fixes
```

### Daily Workflow

```bash
# 1. Start with latest develop
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Make changes and commit
git add .
git commit -m "feat: add your feature description"

# 4. Push to remote
git push origin feature/your-feature-name

# 5. Create pull request on GitHub/GitLab

# 6. After approval, merge to develop
```

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add user authentication
fix: resolve database connection issue
docs: update README with new features
style: format code with prettier
refactor: reorganize component structure
test: add unit tests for user service
chore: update dependencies
```

### Code Quality

```bash
# Run linter
npm run lint

# Run type checker
npm run type-check

# Format code
npm run format

# Run all checks
npm run lint && npm run type-check
```

## Testing

### Manual Testing

```bash
# 1. Start development server
npm run dev

# 2. Test core features:
# - User registration
# - Login/logout
# - Create business
# - Add invoice
# - Upload bank statement
# - Scan receipt
# - Generate reports
```

### Database Testing

```bash
# Test database connection
npm run db:health

# Seed test data
npm run db:seed

# Open database studio to verify data
npm run db:studio
```

### API Testing

Use the included REST Client files or Postman:

```bash
# Create a file: test-api.http
# Use VS Code REST Client extension

### Health Check
GET http://localhost:3000/api/health

### Get User Profile
GET http://localhost:3000/api/user/profile
Authorization: Bearer YOUR_CLERK_TOKEN
```

## Common Development Tasks

### Adding a New Component

```bash
# 1. Create component file
# app/components/features/your-feature.tsx

# 2. Follow component structure
import { FC } from 'react';

export const YourFeature: FC = () => {
  return (
    <div>
      {/* Your component code */}
    </div>
  );
};
```

### Database Migration

```bash
# 1. Modify schema in lib/db/schema.ts

# 2. Generate migration
npm run db:generate

# 3. Review migration file
# Check: drizzle/

# 4. Apply migration
npm run db:push

# 5. Verify changes
npm run db:studio
```

### Adding API Endpoint

```bash
# 1. Create API route
# app/api/your-endpoint/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Your logic here
    return NextResponse.json({ data: 'success' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
```

### Adding Environment Variables

```bash
# 1. Add to .env.local.example
YOUR_NEW_VAR=example_value

# 2. Add to .env.local
YOUR_NEW_VAR=actual_value

# 3. Use in code
const value = process.env.YOUR_NEW_VAR;

# 4. For client-side access, prefix with NEXT_PUBLIC_
NEXT_PUBLIC_YOUR_VAR=example_value

# Use in client components
const value = process.env.NEXT_PUBLIC_YOUR_VAR;
```

## Troubleshooting

### Common Issues

#### Port 3000 Already in Use
```bash
# Find and kill process on port 3000
# On Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# On macOS/Linux:
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

#### Database Connection Failed
```bash
# 1. Verify DATABASE_URL is correct
echo $DATABASE_URL

# 2. Test connection manually
psql $DATABASE_URL

# 3. Check database is running
# For PostgreSQL:
brew services list  # macOS
systemctl status postgresql  # Linux

# 4. Verify network connectivity
ping your-database-host
```

#### Module Not Found Errors
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install

# Clear npm cache
npm cache clean --force
```

### Getting Help

1. **Check Documentation**
   - Read this guide thoroughly
   - Check API documentation
   - Review deployment guide

2. **Search Issues**
   - GitHub Issues
   - Stack Overflow
   - Clerk/Supabase forums

3. **Ask Team**
   - Slack/Discord channel
   - Team standup
   - Code review comments

## Next Steps

### Learning Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Clerk Authentication](https://clerk.com/docs)
- [Supabase Database](https://supabase.com/docs)
- [Drizzle ORM](https://orm.drizzle.team/)

### Project Structure
```
silverpine-ledger/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── components/        # React components
│   ├── dashboard/         # Dashboard pages
│   └── lib/               # Utility functions
├── components/            # Shared components
│   ├── ui/               # UI components (shadcn/ui)
│   └── features/         # Feature-specific components
├── lib/                   # Core libraries
│   ├── db/               # Database setup
│   ├── auth.ts           # Authentication utilities
│   └── utils.ts          # Helper functions
├── public/               # Static assets
└── scripts/              # Utility scripts
```

### Development Tips
1. **Always run type checker** before committing
2. **Test database migrations** on local database first
3. **Use console.log** for debugging, remove before committing
4. **Keep components small** and focused
5. **Write meaningful commit messages**
6. **Update documentation** when adding features

---

**Ready to start developing?**

```bash
# Quick start
npm install
npm run db:push
npm run dev

# Open http://localhost:3000
# Start building! 🚀
```