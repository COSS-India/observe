# Password Management System Documentation

## Overview

The Bhashini Login API now includes a comprehensive password management system with three key improvements:

1. **Email Service Integration** - Automated email notifications with SMTP
2. **Dynamic Password Generation** - Secure temporary passwords with expiration
3. **Password Reset System** - Complete password reset workflow

## 🔐 Password System Features

### 1. Dynamic Password Generation
- **Temporary Passwords**: 12-character secure passwords with mixed case, numbers, and symbols
- **Expiration**: Temporary passwords expire in 24 hours
- **Security**: Each password is unique and cryptographically secure

### 2. Email Notifications
- **Welcome Emails**: Sent to new users with temporary credentials
- **Password Reset Emails**: Sent when users request password reset
- **HTML Templates**: Professional email templates with styling
- **SMTP Support**: Configurable SMTP settings for different email providers

### 3. Password Reset Workflow
- **Token-based Reset**: Secure tokens with 1-hour expiration
- **Email Delivery**: Reset links sent via email
- **One-time Use**: Tokens can only be used once
- **Automatic Cleanup**: Expired tokens are automatically cleaned up

## 📧 Email Configuration

### SMTP Settings (Gmail Example)
```env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_TLS=true
SMTP_SSL=false
FROM_EMAIL=noreply@bhashini.gov.in
FROM_NAME=Bhashini Platform
FRONTEND_URL=https://your-frontend-domain.com
```

### Gmail Setup Instructions
1. Enable 2-factor authentication on your Gmail account
2. Generate an "App Password" for the application
3. Use the app password (not your regular password) in `SMTP_PASSWORD`

## 🚀 API Endpoints

### New Password Management Endpoints

#### 1. Request Password Reset
```http
POST /v1/password-reset
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "If the email exists, a password reset link has been sent."
}
```

#### 2. Confirm Password Reset
```http
POST /v1/password-reset/confirm
Content-Type: application/json

{
  "token": "reset_token_from_email",
  "new_password": "new_secure_password"
}
```

**Response:**
```json
{
  "message": "Password has been reset successfully. You can now login with your new password."
}
```

### Updated Signup Flow

#### Signup Request
```http
POST /v1/signup
Content-Type: application/x-www-form-urlencoded

request_data={"first_name":"John","last_name":"Doe","email_id":"john@example.com","role":"customer","org":{"org_type":"Government","org_name":"Test Org","org_details":{"industry_type":"Technology","is_startup":false,"is_dpiit_certified":false,"is_interested_in_api_integration":true}},"tnc_url":"https://example.com/terms"}
```

**Response:**
```json
{
  "message": "Your request is received. Kindly Check your email inbox for credentials"
}
```

### Updated Signin Flow

#### Signin Request
```http
POST /v1/signin
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "temporary_password_from_email",
  "captcha_text": "captcha_text",
  "captcha_id": "captcha_id"
}
```

**Response (First Login - Password Change Required):**
```json
{
  "email": "john@example.com",
  "token": "jwt_token",
  "role": "customer",
  "username": "John Doe",
  "org_type": "Government",
  "userinfo": {
    "is_fresh": true,
    "is_profile_updated": false,
    "is_existing_user": false,
    "stage_completed": null
  },
  "message": "Login successful. Please change your password.",
  "user_type": [],
  "event_name": null,
  "is_external": false
}
```

## 🔄 User Journey

### New User Registration
1. **User submits signup form**
2. **System generates unique temporary password**
3. **User account created with temporary password**
4. **Welcome email sent with credentials**
5. **User receives email with temporary password**

### First Login
1. **User logs in with temporary password**
2. **System detects password change requirement**
3. **Login successful but prompts password change**
4. **User must change password before full access**

### Password Reset Flow
1. **User requests password reset**
2. **System generates reset token**
3. **Reset email sent with secure link**
4. **User clicks link and sets new password**
5. **Password updated and user can login**

## 🛠️ Database Schema Changes

### New Fields Added to Users Table
```sql
-- Temporary password expiration
temp_password_expires_at TIMESTAMP WITH TIME ZONE

-- Password reset token
password_reset_token VARCHAR(255)

-- Reset token expiration
password_reset_expires_at TIMESTAMP WITH TIME ZONE
```

## 🔧 Configuration

### Environment Variables
```env
# Email Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_TLS=true
SMTP_SSL=false
FROM_EMAIL=noreply@bhashini.gov.in
FROM_NAME=Bhashini Platform
FRONTEND_URL=https://your-frontend-domain.com

# Password Settings
TEMP_PASSWORD_LENGTH=12
TEMP_PASSWORD_EXPIRY_HOURS=24
RESET_TOKEN_LENGTH=32
RESET_TOKEN_EXPIRY_HOURS=1
```

## 🧪 Testing

### Test Password Generation
```python
from app.services.password_service import password_service

# Generate temporary password
temp_pass = password_service.generate_temp_password()
print(f"Temporary password: {temp_pass}")

# Generate reset token
reset_token = password_service.generate_reset_token()
print(f"Reset token: {reset_token}")
```

### Test Email Service
```python
from app.services.email_service import email_service

# Send welcome email
success = email_service.send_welcome_email(
    to_email="test@example.com",
    first_name="Test User",
    temp_password="temp123",
    reset_token="token123"
)
print(f"Email sent: {success}")
```

## 🚨 Security Features

1. **Secure Password Generation**: Uses cryptographically secure random generation
2. **Token Expiration**: All tokens have expiration times
3. **One-time Use**: Reset tokens can only be used once
4. **Email Validation**: Proper email format validation
5. **Password Hashing**: All passwords are properly hashed with bcrypt
6. **Rate Limiting**: Built-in protection against brute force attacks

## 📝 Migration

### Running Database Migration
```bash
# Run the password fields migration
python migrate_password_fields.py
```

### Installing Dependencies
```bash
# Install new email dependencies
pip install fastapi-mail jinja2
```

## 🎯 Benefits

1. **Enhanced Security**: Dynamic passwords and token-based resets
2. **Better UX**: Professional email notifications
3. **Automated Workflow**: No manual password management
4. **Scalable**: Works with any SMTP provider
5. **Compliant**: Follows security best practices

## 🔍 Monitoring

### Log Messages
- Password generation events
- Email sending status
- Token expiration warnings
- Failed authentication attempts

### Health Checks
- SMTP connectivity
- Database connection
- Token cleanup status

This comprehensive password management system provides enterprise-grade security while maintaining a smooth user experience.


