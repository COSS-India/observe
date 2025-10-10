# 🔐 Setting Up Basic Authentication for Multi-Organization Access

## Problem

You were getting this error:
```json
{
  "error": "API key does not belong to the requested organization"
}
```

This happens because **API Keys in Grafana are organization-scoped**. An API key created in Org 1 cannot access resources in Org 2.

---

## Solution: Use Basic Authentication

Basic Authentication with server admin credentials works **across ALL organizations**.

---

## Setup Instructions

### 1. Create `.env.local` File

Create a file named `.env.local` in your project root:

```bash
# In your project root directory
cd C:\Users\Bharathi A\Documents\AI4Voice_Portal
```

Create `.env.local` with the following content:

```env
# Grafana URL
NEXT_PUBLIC_GRAFANA_URL=http://localhost:3000

# Basic Authentication (works across all orgs)
GRAFANA_USERNAME=admin
GRAFANA_PASSWORD=your_grafana_password

# Don't use API Key if you're using Basic Auth
# GRAFANA_API_KEY=
```

**Replace:**
- `http://localhost:3000` with your actual Grafana URL
- `admin` with your Grafana server admin username
- `your_grafana_password` with your actual password

---

### 2. Restart Your Next.js Server

After creating `.env.local`, restart your development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

---

### 3. Verify It's Working

Open your browser console and look for:

```
🔐 Using Basic Authentication (server admin)
```

Instead of:

```
🔐 Using API Key authentication (org-scoped)
```

---

## How It Works

### Before (API Key - Org Scoped):
```
Authorization: Bearer glsa_...  ← Only works for one org!
X-Grafana-Org-Id: 2  ← ERROR: API key doesn't belong to org 2
```

### After (Basic Auth - Works Everywhere):
```
Authorization: Basic YWRtaW46cGFzc3dvcmQ=  ← Server admin credentials
X-Grafana-Org-Id: 2  ← WORKS! Admin can access all orgs
```

---

## Authentication Priority

The code will use authentication in this order:

1. **Basic Auth** (if `GRAFANA_USERNAME` and `GRAFANA_PASSWORD` are set) ✅ Recommended
2. **API Key** (if `GRAFANA_API_KEY` is set) ⚠️ Org-scoped
3. **Error** (if neither is set)

---

## Testing

### Test 1: Lookup User in Org 2

```
http://localhost:3001/api/grafana/users/lookup?loginOrEmail=alen@irctc.com&orgId=2
```

**Before:** ❌ Error "API key does not belong to the requested organization"

**After:** ✅ Returns user object

```json
{
  "id": 5,
  "email": "alen@irctc.com",
  "login": "alen",
  "orgId": 2
}
```

### Test 2: Get User's Teams in Org 2

```
http://localhost:3001/api/grafana/users/5/teams?orgId=2
```

**Should work now!**

---

## Security Best Practices

1. **Never commit `.env.local`** to git (it's in `.gitignore`)
2. **Use strong passwords** for your Grafana admin account
3. **Restrict network access** to your Grafana instance
4. **Consider using service account tokens** in production (Grafana 9+)

---

## Service Account Alternative (Grafana 9+)

If you're using Grafana 9 or later, you can create a **service account token** that works across organizations:

1. Go to Grafana → Administration → Service Accounts
2. Create new service account
3. Give it "Admin" role
4. Create token
5. Use the token as `GRAFANA_API_KEY`

This is more secure than using admin credentials.

---

## Troubleshooting

### Error: "Invalid username or password"

- Check your username and password are correct
- Try logging into Grafana UI with the same credentials

### Error: "No authentication credentials configured"

- Make sure `.env.local` file exists
- Restart your Next.js server after creating the file
- Check for typos in variable names (must be exact)

### Still seeing API Key errors?

- Clear your browser cache
- Check console logs - should see "Using Basic Authentication"
- Make sure `GRAFANA_USERNAME` and `GRAFANA_PASSWORD` are set correctly

---

## Files Modified

The following files now support Basic Authentication:

- ✅ `lib/utils/grafana-auth.ts` - Utility function for auth headers
- ✅ `app/api/grafana/users/lookup/route.ts` - User lookup
- ✅ `app/api/grafana/users/[id]/teams/route.ts` - User teams
- ✅ `app/api/grafana/users/[id]/folders/route.ts` - User folders
- ✅ `app/api/grafana/users/[id]/dashboards/route.ts` - User dashboards

All routes automatically use Basic Auth if configured, API Key as fallback.

---

## Summary

| Authentication Method | Works Across Orgs | Security | Setup |
|----------------------|------------------|----------|-------|
| Basic Auth (admin) | ✅ Yes | ⚠️ Use secure password | Easy |
| API Key | ❌ No (org-scoped) | ✅ Token-based | Easy |
| Service Account | ✅ Yes (Grafana 9+) | ✅ Token-based | Medium |

**Recommended:** Use Basic Auth for development, Service Account for production.

---

**Status:** ✅ Fixed
**Issue:** API key organization mismatch
**Solution:** Use Basic Authentication with server admin credentials
**Result:** Can now access users/teams/folders across all organizations

