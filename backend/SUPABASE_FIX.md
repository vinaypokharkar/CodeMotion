# Supabase Upload Fix Guide

## Problem
You're getting a `403 Unauthorized` error with `new row violates row-level security policy`. This happens because:
1. You're using the **Anon Key** (public key) which respects RLS policies
2. The bucket likely has RLS enabled or restrictive policies

## Solution

### Option 1: Use Service Role Key (Recommended for Backend)
The **Service Role Key** bypasses RLS and is meant for backend/server operations.

**Steps:**
1. Go to [Supabase Console](https://supabase.com/)
2. Select your project
3. Go to **Settings → API**
4. Copy the **Service Role Secret** (not Anon Key)
5. Update your `.env` file:
   ```
   SUPABASE_KEY=your-service-role-secret-key-here
   ```

### Option 2: Disable RLS on the Bucket (Less Secure)
If you want to keep using the Anon Key:

1. Go to **Storage → Videos bucket → Policies**
2. Look for RLS policies and disable them
3. Set bucket to **Public** (make sure you want public uploads!)

### Option 3: Create a Specific RLS Policy
Allow authenticated or service uploads only:

1. Go to **Storage → Videos bucket → Policies**
2. Create a policy that allows `INSERT` for service role
3. Create a policy that allows `SELECT` for public access (downloads)

## How to Find Your Keys
- **Project URL**: Settings → API → Project URL
- **Anon Key**: Settings → API → Anon public key (safe for frontend)
- **Service Role Secret**: Settings → API → Service role secret (keep private!)

## Security Note
⚠️ Never commit Service Role keys to git. Keep them in `.env` and add `.env` to `.gitignore`.
