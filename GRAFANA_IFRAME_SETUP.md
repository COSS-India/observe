# 🔧 Fix Grafana Iframe Embedding

## Error

```
Refused to display 'http://localhost:3000/' in a frame because it set 'X-Frame-Options' to 'deny'.
```

This happens because Grafana's default security setting blocks iframe embedding.

---

## ✅ Solution: Enable Iframe Embedding in Grafana

### **Method 1: Environment Variables (Docker)**

If you're running Grafana in Docker, add this environment variable:

```yaml
# docker-compose.yml
services:
  grafana:
    image: grafana/grafana:latest
    environment:
      - GF_SECURITY_ALLOW_EMBEDDING=true
    ports:
      - "3000:3000"
```

**Or via Docker CLI:**
```bash
docker run -d \
  -p 3000:3000 \
  -e GF_SECURITY_ALLOW_EMBEDDING=true \
  grafana/grafana:latest
```

---

### **Method 2: Configuration File (grafana.ini)**

If you're running Grafana directly, edit the `grafana.ini` file:

**Location:**
- Linux: `/etc/grafana/grafana.ini`
- Windows: `C:\Program Files\GrafanaLabs\grafana\conf\grafana.ini`
- macOS: `/usr/local/etc/grafana/grafana.ini`

**Add/Update:**
```ini
[security]
# Allow embedding Grafana in iframes
allow_embedding = true

# Optional: Specify which domains can embed (for better security)
# cookie_samesite = none
```

**Restart Grafana:**
```bash
# Linux/macOS
sudo systemctl restart grafana-server

# Windows
Restart the Grafana service from Services

# Docker
docker restart grafana
```

---

### **Method 3: Kubernetes/Helm**

If using Helm chart:

```yaml
# values.yaml
grafana.ini:
  security:
    allow_embedding: true
```

---

## 🔒 **Security Considerations**

### **Option A: Allow All (Simple but less secure)**
```ini
[security]
allow_embedding = true
```

### **Option B: Restrict to Specific Domains (More secure)**
```ini
[security]
allow_embedding = true
cookie_samesite = none

# In newer Grafana versions, you can also set:
[security]
allow_embedding = true
cookie_samesite = lax
# And configure allowed domains
```

---

## ✅ **Verify It's Working**

After enabling embedding and restarting Grafana:

### **Test 1: Check Grafana Configuration**

Visit your Grafana instance and check the browser console when loading a dashboard.

### **Test 2: Test Embedding**

Open your portal's "My Dashboards" page and check:

**Before:**
```
❌ Refused to display 'http://localhost:3000/' in a frame because it set 'X-Frame-Options' to 'deny'.
```

**After:**
```
✅ Dashboard panels display correctly in iframes
```

---

## 📋 **Additional Configuration (Optional)**

### **Anonymous Access (If needed)**

If you want panels to load without authentication in the iframe:

```ini
[auth.anonymous]
enabled = true
org_name = Main Org.
org_role = Viewer
```

⚠️ **Warning:** This allows anyone to view dashboards. Only use in trusted environments.

---

### **CORS Settings (If needed)**

If your portal runs on a different domain than Grafana:

```ini
[security]
allow_embedding = true
cookie_samesite = none

[server]
# Allow cross-origin requests
enable_cors = true
cors_allow_origin = http://localhost:3001
```

---

## 🐳 **Quick Docker Example**

Create `docker-compose.yml`:

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
      
      # Optional: Anonymous access for easier embedding
      # - GF_AUTH_ANONYMOUS_ENABLED=true
      # - GF_AUTH_ANONYMOUS_ORG_NAME=Main Org.
      # - GF_AUTH_ANONYMOUS_ORG_ROLE=Viewer
      
    volumes:
      - grafana-storage:/var/lib/grafana
    restart: unless-stopped

volumes:
  grafana-storage:
```

**Start it:**
```bash
docker-compose up -d
```

---

## 🔍 **Troubleshooting**

### **Still getting X-Frame-Options error?**

1. **Check Grafana is restarted:**
   ```bash
   # Docker
   docker restart grafana
   
   # Linux
   sudo systemctl status grafana-server
   sudo systemctl restart grafana-server
   ```

2. **Verify configuration:**
   - Check `grafana.ini` file
   - Look for `[security]` section
   - Ensure `allow_embedding = true` is set

3. **Check browser console:**
   - Clear cache (Ctrl+Shift+Delete)
   - Hard refresh (Ctrl+Shift+R)
   - Check for new errors

4. **Check Grafana logs:**
   ```bash
   # Docker
   docker logs grafana
   
   # Linux
   sudo journalctl -u grafana-server -f
   ```

### **Authentication Issues in Iframe?**

If panels show login page:

**Option 1:** Enable anonymous access (see above)

**Option 2:** Use Grafana's authentication proxy

**Option 3:** Ensure cookies are being sent:
```ini
[security]
cookie_samesite = none
cookie_secure = false  # Only for local development!
```

---

## 📝 **Environment Variable Reference**

All Grafana security settings can be set via environment variables:

```bash
# Enable embedding
GF_SECURITY_ALLOW_EMBEDDING=true

# Cookie settings
GF_SECURITY_COOKIE_SAMESITE=none
GF_SECURITY_COOKIE_SECURE=false

# Anonymous access (optional)
GF_AUTH_ANONYMOUS_ENABLED=true
GF_AUTH_ANONYMOUS_ORG_NAME=Main Org.
GF_AUTH_ANONYMOUS_ORG_ROLE=Viewer
```

---

## 🎯 **Recommended Configuration**

For your AI4Voice Portal with Basic Auth:

```ini
[security]
# Allow iframe embedding
allow_embedding = true

# Cookie settings for iframe
cookie_samesite = lax

[auth.anonymous]
# Optional: Allow anonymous viewing
enabled = true
org_name = Main Org.
org_role = Viewer
```

---

## ⚠️ **Important Notes**

1. **Security Risk:** Allowing embedding increases attack surface. Only enable in trusted environments.

2. **Production:** Use HTTPS and set:
   ```ini
   cookie_secure = true
   cookie_samesite = strict
   ```

3. **Different Domains:** If portal and Grafana are on different domains, you'll need proper CORS configuration.

4. **Grafana Version:** Some settings may vary by version. Check your Grafana documentation.

---

## 🚀 **Quick Fix for Local Development**

**If using Docker:**
```bash
docker run -d \
  --name=grafana \
  -p 3000:3000 \
  -e GF_SECURITY_ALLOW_EMBEDDING=true \
  grafana/grafana:latest
```

**If using existing Grafana:**
1. Edit `grafana.ini`
2. Add `allow_embedding = true` under `[security]`
3. Restart Grafana
4. Refresh your portal page

---

**After enabling this setting, your dashboard panels will display correctly in the portal!** 🎉

