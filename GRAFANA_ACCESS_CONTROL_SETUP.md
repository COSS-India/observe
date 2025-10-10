# ✅ Grafana Access Control - Setup Complete

## 🎯 What Was Fixed

Your portal now correctly implements user-based access control for dashboards across multiple organizations.

---

## 🔐 Authentication Setup

### **Environment Variables Required**

Your `.env.local` file should have:

```env
NEXT_PUBLIC_GRAFANA_URL=http://localhost:3000

# Basic Authentication (works across ALL organizations)
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=password

# Comment out API key to avoid conflicts
# GRAFANA_API_KEY=your_api_key_here
```

**Note:** The code supports both `GRAFANA_USERNAME`/`GRAFANA_PASSWORD` and `GRAFANA_ADMIN_USER`/`GRAFANA_ADMIN_PASSWORD`.

---

## ✅ Fixed Issues

### 1. **Organization-Scoped API Key Error** ✅
**Before:**
```
Error: "API key does not belong to the requested organization"
```

**Fix:**
- All 26 API routes now use Basic Authentication
- Created `lib/utils/grafana-auth.ts` utility
- Basic Auth works across ALL organizations

---

### 2. **Undefined User ID Error** ✅
**Before:**
```
http://localhost:3001/api/grafana/users/undefined/teams
```

**Fix:**
- Created `/api/grafana/users/lookup` endpoint
- Uses Grafana's `GET /api/users/lookup?loginOrEmail=` API
- Correctly resolves user ID from email

---

### 3. **Hardcoded Organization ID in Panel URLs** ✅
**Before:**
```tsx
?orgId=1  // Hardcoded - breaks for other orgs!
```

**Fix:**
- `DashboardPanelExtractor` now fetches organization ID dynamically
- Uses user's organization from auth context
- Panel iframes use correct `?orgId={dynamicOrgId}`

---

### 4. **Fallback to All Dashboards** ✅
**Before:**
- If access checks failed, showed ALL dashboards

**Fix:**
- Removed problematic fallback
- Shows only dashboards user actually has access to
- Empty list if user has no permissions

---

## 🔄 How Access Control Works

### Step 1: User Lookup
```
GET /api/users/lookup?loginOrEmail=user@example.com
Headers: X-Grafana-Org-Id: 2
→ Returns user ID
```

### Step 2: Get User's Teams
```
GET /api/users/{userId}/teams
Headers: X-Grafana-Org-Id: 2
→ Returns teams user belongs to
```

### Step 3: Get Folders with Permissions
```
GET /api/folders
→ Get all folders in org

For each folder:
  GET /api/folders/{uid}/permissions
  → Check if userId or teamId matches
  → Include only accessible folders
```

### Step 4: Get Dashboards from Accessible Folders
```
For each accessible folder:
  GET /api/search?type=dash-db&folderUids={uid}
  → Returns dashboards in that folder
```

### Step 5: Display Panels
```
For selected dashboard:
  GET /api/dashboards/{uid}
  → Extract panel IDs and titles
  
Display each panel:
  iframe: /d-solo/{dashboardUid}?orgId={dynamicOrgId}&panelId={panelId}
```

---

## 📝 Updated Files

### Core Infrastructure (2 files)
- ✅ **lib/utils/grafana-auth.ts** - Centralized Basic Auth utility
- ✅ **lib/api/grafana.ts** - Updated to pass orgId params

### API Routes (26 files)
All routes now use `getGrafanaAuthHeaders()`:

**User Routes:**
- users/lookup/route.ts
- users/route.ts
- users/[id]/route.ts
- users/[id]/teams/route.ts
- users/[id]/folders/route.ts
- users/[id]/dashboards/route.ts
- users/[id]/enable/route.ts
- users/[id]/disable/route.ts

**Team Routes:**
- teams/route.ts
- teams/[id]/route.ts
- teams/[id]/dashboards/route.ts
- teams/[id]/folders/route.ts
- teams/[id]/members/route.ts
- teams/[id]/members/[userId]/route.ts

**Folder Routes:**
- folders/route.ts
- folders/[uid]/route.ts
- folders/[uid]/permissions/route.ts

**Dashboard Routes:**
- dashboards/route.ts
- dashboards/[uid]/route.ts
- dashboards/[uid]/move/route.ts
- dashboards/[uid]/permissions/route.ts

**Organization Routes:**
- orgs/route.ts
- orgs/[id]/route.ts
- orgs/[id]/users/route.ts
- orgs/[id]/users/[userId]/route.ts

**Other:**
- health/route.ts

### UI Components (2 files)
- ✅ **components/dashboards/DashboardPanelExtractor.tsx** - Dynamic orgId
- ✅ **hooks/useUserDashboards.ts** - Uses lookupUser API

---

## 🧪 Testing

### Test User Lookup (Org 2)
```
http://localhost:3001/api/grafana/users/lookup?loginOrEmail=alen@irctc.com&orgId=2
```

**Expected:**
```json
{
  "id": 5,
  "email": "alen@irctc.com",
  "login": "alen",
  "orgId": 2
}
```

### Test User Teams (Org 2)
```
http://localhost:3001/api/grafana/users/5/teams?orgId=2
```

**Expected:**
```json
[
  {
    "id": 1,
    "name": "IRCTC Team",
    "orgId": 2
  }
]
```

### Test Folder Permissions
```
http://localhost:3001/api/grafana/folders/cf0ikbnoasav4c/permissions
```

**Expected:** Array of permissions (no "Invalid API key" error)

---

## 🎯 Console Logs to Expect

When you load "My Dashboards":

```
🔍 Fetching dashboards for user: alen@irctc.com in organization: IRCTC
🏢 All organizations: [...]
✅ Found organization: IRCTC (ID: 2)
🔍 Looking up user by email: alen@irctc.com
✅ Found Grafana user via lookup API: {id: 5, email: "alen@irctc.com", ...}
🔐 Using Basic Authentication (server admin)
👥 User is member of 1 teams
🔐 Checking folder permissions...
✅ User 5 has team access to folder XYZ via team 1
📊 User has access to 3 folders
✅ Total dashboards accessible by user: 8
🏢 Found organization ID: 2 for IRCTC
🏢 Using organization ID: 2 for panel display
```

---

## 📊 Summary of Changes

| Component | Status | Description |
|-----------|--------|-------------|
| **Authentication** | ✅ Fixed | Basic Auth across all orgs |
| **User Lookup** | ✅ Fixed | Uses `/api/users/lookup` |
| **Access Control** | ✅ Fixed | Permission-based filtering |
| **Panel Display** | ✅ Fixed | Dynamic orgId in iframe URLs |
| **Fallback Removed** | ✅ Fixed | No more showing all dashboards |

---

## 🔍 Direct Grafana API cURL Examples

### User Lookup with Basic Auth:
```bash
curl -X GET "http://localhost:3000/api/users/lookup?loginOrEmail=alen@irctc.com" \
  -H "Authorization: Basic YWRtaW46cGFzc3dvcmQ=" \
  -H "X-Grafana-Org-Id: 2" \
  -H "Content-Type: application/json"
```

### Get User's Teams:
```bash
curl -X GET "http://localhost:3000/api/users/5/teams" \
  -H "Authorization: Basic YWRtaW46cGFzc3dvcmQ=" \
  -H "X-Grafana-Org-Id: 2" \
  -H "Content-Type: application/json"
```

### Get Folder Permissions:
```bash
curl -X GET "http://localhost:3000/api/folders/cf0ikbnoasav4c/permissions" \
  -H "Authorization: Basic YWRtaW46cGFzc3dvcmQ=" \
  -H "Content-Type: application/json"
```

**Replace `YWRtaW46cGFzc3dvcmQ=` with base64 of `your_username:your_password`**

---

## ⚙️ Requirements Checklist

For access control to work properly:

- [x] Basic Auth configured in `.env.local`
- [x] Users exist in Grafana organizations
- [x] Users are members of teams
- [x] Folders have permissions set for teams/users
- [x] Dashboards are in folders (not General)
- [x] API routes use Basic Authentication
- [x] Panel URLs use dynamic organization ID

---

## 🚀 Next Steps

1. **Restart your server** if not already done
2. **Login to your portal** with a user
3. **Navigate to "My Dashboards"**
4. **Check console** for the logs above
5. **Verify** only accessible dashboards are shown
6. **Select a dashboard** and verify panels load with correct orgId

---

**Status:** ✅ **COMPLETE**

All access control issues resolved. Users now see only their accessible dashboards, and panels display correctly with the right organization context.

