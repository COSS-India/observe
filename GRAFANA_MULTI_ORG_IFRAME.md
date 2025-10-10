# 🏢 Grafana Multi-Organization Iframe Setup

## Problem

Anonymous auth in Grafana is typically configured for ONE organization:

```ini
[auth.anonymous]
enabled = true
org_name = Main Org.  ← Only works for this org!
org_role = Viewer
```

But you need panels to work for users from **ANY organization** (Org 1, Org 2, etc.).

---

## ✅ Solution: Use orgId Parameter in URLs

Even though anonymous auth points to one default org, you can **switch organizations** using the `orgId` parameter in the URL.

### **Grafana Configuration:**

```ini
[security]
allow_embedding = true

[auth.anonymous]
enabled = true
# Set a default org (any org is fine, we'll override with orgId param)
org_name = Main Org.
org_role = Viewer

# IMPORTANT: Allow switching organizations
[users]
# Allow users to switch organizations
allow_org_create = false
auto_assign_org = true
auto_assign_org_id = 1
auto_assign_org_role = Viewer
```

### **Docker Environment Variables:**

```bash
docker run -d \
  --name=grafana \
  -p 3000:3000 \
  -e GF_SECURITY_ALLOW_EMBEDDING=true \
  -e GF_AUTH_ANONYMOUS_ENABLED=true \
  -e GF_AUTH_ANONYMOUS_ORG_NAME="Main Org." \
  -e GF_AUTH_ANONYMOUS_ORG_ROLE=Viewer \
  -e GF_USERS_ALLOW_ORG_CREATE=false \
  -e GF_USERS_AUTO_ASSIGN_ORG=true \
  -e GF_USERS_AUTO_ASSIGN_ORG_ID=1 \
  -e GF_USERS_AUTO_ASSIGN_ORG_ROLE=Viewer \
  grafana/grafana:latest
```

---

## 🎯 **How It Works**

### **1. Anonymous User Starts in Default Org:**
```
Anonymous user → Org 1 (Main Org.) by default
```

### **2. URL Parameter Switches Organization:**
```
http://localhost:3000/d-solo/{dashboardUid}/...?orgId=2&panelId=1
                                                  ↑
                                    This switches to Org 2!
```

### **3. Your Code Already Does This! ✅**

Your panel URLs already include `orgId`:

```tsx
// In DashboardPanelExtractor.tsx (line 242)
src={`${GRAFANA_URL}/d-solo/${dashboardUid}/...?orgId=${orgId}&panelId=${panel.id}...`}
                                                    ↑
                                          Uses user's actual org ID!
```

**For user in Org 2:** URL will be `?orgId=2`  
**For user in Org 3:** URL will be `?orgId=3`

---

## ✅ **Complete Setup**

### **Docker Compose (Recommended):**

```yaml
version: '3.8'

services:
  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3000:3000"
    environment:
      # Enable iframe embedding
      - GF_SECURITY_ALLOW_EMBEDDING=true
      
      # Enable anonymous access (default to any org)
      - GF_AUTH_ANONYMOUS_ENABLED=true
      - GF_AUTH_ANONYMOUS_ORG_ROLE=Viewer
      
      # Allow auto-assignment to orgs
      - GF_USERS_AUTO_ASSIGN_ORG=true
      - GF_USERS_AUTO_ASSIGN_ORG_ROLE=Viewer
      
    volumes:
      - grafana-storage:/var/lib/grafana
    restart: unless-stopped

volumes:
  grafana-storage:
```

### **grafana.ini (If not using Docker):**

```ini
[security]
allow_embedding = true
cookie_samesite = lax

[auth.anonymous]
enabled = true
org_role = Viewer

[users]
auto_assign_org = true
auto_assign_org_role = Viewer
```

---

## 🧪 **Test Multi-Org Access**

### **Test Panel from Org 1:**
```
http://localhost:3000/d-solo/dashboard-uid/name?orgId=1&panelId=2
```

### **Test Panel from Org 2:**
```
http://localhost:3000/d-solo/dashboard-uid/name?orgId=2&panelId=2
```

Both should work! The `orgId` parameter switches the anonymous user's context.

---

## 🔒 **Security Best Practices**

Since anonymous access is enabled:

### **1. Network Security:**

**Option A: IP Whitelist**
```nginx
# Only allow portal server
location / {
  allow 192.168.1.100;  # Your portal server
  deny all;
  proxy_pass http://localhost:3000;
}
```

**Option B: Internal Network Only**
- Keep Grafana on internal network
- Don't expose to public internet
- Only portal server can reach it

### **2. Read-Only Access:**
```ini
org_role = Viewer  # No editing allowed
```

### **3. Dashboard Permissions:**
- Set permissions on folders/dashboards
- Anonymous users respect these permissions
- Even though anonymous, they still need permission to view

---

## ⚠️ **Important Notes**

### **Anonymous Users CAN:**
- ✅ View dashboards they have permission to see
- ✅ Switch orgs using `?orgId=` parameter
- ✅ View panels in iframes

### **Anonymous Users CANNOT:**
- ❌ Edit dashboards
- ❌ Create new resources
- ❌ Access admin features
- ❌ See resources without proper folder permissions

### **Your Portal Controls:**
Your portal **still controls** what dashboards users can see through:
- ✅ User authentication in portal
- ✅ Team membership checks
- ✅ Folder permission verification
- ✅ Only showing accessible dashboards

---

## 🎯 **TL;DR**

**Setup:**
1. Enable anonymous access in Grafana (any default org is fine)
2. Enable iframe embedding
3. Your code already passes `orgId` parameter in URLs ✅

**Result:**
- Anonymous user can view dashboards from **any organization**
- Organization is switched via `?orgId=X` in URL
- Your portal controls which dashboards are shown
- Grafana permissions still apply

**Security:**
- Anonymous = Viewer role only (read-only)
- Network restrictions prevent unauthorized access
- Your portal handles authentication & authorization
- Grafana provides the display layer

---

## 🚀 **Minimal Configuration:**

Just add this to your Grafana:

```bash
# Docker
-e GF_SECURITY_ALLOW_EMBEDDING=true
-e GF_AUTH_ANONYMOUS_ENABLED=true
-e GF_AUTH_ANONYMOUS_ORG_ROLE=Viewer
```

That's it! The `orgId` parameter in your iframe URLs handles the multi-org switching.
