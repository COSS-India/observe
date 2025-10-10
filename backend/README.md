# Adopter Login API

A FastAPI-based authentication system with captcha verification for the Adopter platform.

## Features

- **User Authentication**: Signin and signup functionality
- **Captcha Integration**: Image-based captcha for login security
- **JWT Tokens**: Secure token-based authentication
- **PostgreSQL Database**: Robust data persistence
- **Form Data Support**: Handles multipart form data for signup
- **RESTful API**: Clean and well-documented API endpoints

## Project Structure

```
app/
├── __init__.py
├── main.py                 # FastAPI application entry point
├── core/
│   ├── __init__.py
│   ├── config.py           # Configuration settings
│   └── database.py         # Database connection and session
├── models/
│   ├── __init__.py
│   └── user.py             # SQLAlchemy models
├── schemas/
│   ├── __init__.py
│   └── user.py             # Pydantic schemas
├── api/
│   ├── __init__.py
│   └── v1/
│       ├── __init__.py
│       └── auth.py          # Authentication endpoints
├── services/
│   ├── __init__.py
│   ├── auth_service.py     # Authentication business logic
│   └── captcha_service.py  # Captcha generation and verification
└── utils/
    ├── __init__.py
    └── security.py          # Security utilities (JWT, password hashing)
```

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Obs-Adopter-Login
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up PostgreSQL database**
   - Install PostgreSQL
   - Create database named `adopter`
   - Update database credentials in `env.example` and rename to `.env`

5. **Initialize database**
   ```bash
   python init_db.py
   ```

6. **Run the application**
   ```bash
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

## API Endpoints

### 1. Generate Captcha
- **POST** `/v1/captcha`
- **Response**: 
  ```json
  {
    "captcha": {
      "captcha_id": "3VXEtImOk4",
      "image": "iVBORw0KGgoAAAANSUhEUgAAAGMAAAAgCAIAAACJlVEAAAAC7ElEQVR4nGP8c/8fwyggAjANtAOGDBgNKWLBaEgRC0ZDilgwGlLEgtGQIhaMhhSxYDSkiAWjIUUsGA0pYsFoSBELRkOKWDAaUsQC8kPK3iKabL337j4OC8j/9+8/hBsTaibUzCc1hAzc5fKIFpIb7S00ksY3YB5IChUkpJsWaJWyqhMIrUFS9njoqxpUlZPC//OExOotvApIAOvK3KRNkjQJFUd2TxioKIGl25Q6JBCNxg3naVm93X8UkkKUnFFQYSwGCVDDgrYrP4tgBRCMjuDO2B2jgCKFJJrD6yFay3SBa7OQIU..."
    }
  }
  ```

### 2. User Signin
- **POST** `/v1/signin`
- **Request Body**:
  ```json
  {
    "email": "test@karmayogi.in",
    "password": "test@1234",
    "captcha_text": "IN945v",
    "captcha_id": "zk9JKKIv1b"
  }
  ```
- **Response**:
  ```json
  {
    "email": "test@karmayogi.in",
    "token": "sssssssssss.hsjsddkd.GrO_1tGuWlIYDM1m7m-KFZE9Zr9bOUxQt9_eKz0yJxI",
    "role": "customer",
    "username": "test",
    "org_type": "Central Government",
    "userinfo": {
      "is_fresh": false,
      "is_profile_updated": true,
      "is_existing_user": false,
      "stage_completed": null
    },
    "message": "Login successful",
    "user_type": [],
    "event_name": null,
    "is_external": false
  }
  ```

### 3. User Signup
- **POST** `/v1/signup`
- **Content-Type**: `application/json`
- **Request Body**:
  ```json
  {
    "first_name": "shez",
    "last_name": "shez",
    "email_id": "shezz13012000@gmail.com",
    "role": "customer",
    "org": {
      "org_type": "Private Corporate Sector",
      "org_name": "test",
      "org_details": {
        "industry_type": "Information Technology (IT)",
        "is_startup": false,
        "is_dpiit_certified": false,
        "is_interested_in_api_integration": false
      }
    },
    "tnc_url": "https://userdatav1.blob.core.windows.net/dashboardblob/Terms_and_Conditions_Adopter.pdf"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Your request is received. Kindly Check your email inbox for credentials"
  }
  ```

### 4. Health Check
- **GET** `/v1/health`
- **Response**:
  ```json
  {
    "status": "healthy",
    "message": "Adopter Login API is running"
  }
  ```

## Configuration

Create a `.env` file based on `env.example`:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/adopter

# JWT Configuration
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Captcha Configuration
CAPTCHA_EXPIRE_MINUTES=5

# App Configuration
APP_NAME=Adopter Login API
DEBUG=True
```

## Testing

### Sample User Credentials
After running `init_db.py`, you can use these credentials for testing:
- **Email**: `test@karmayogi.in`
- **Password**: `test@1234`

### API Testing with curl

1. **Get Captcha**:
   ```bash
   curl -X POST "http://localhost:8000/v1/captcha"
   ```

2. **Signin**:
   ```bash
   curl -X POST "http://localhost:8000/v1/signin" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@karmayogi.in",
       "password": "test@1234",
       "captcha_text": "CAPTCHA_TEXT_FROM_PREVIOUS_RESPONSE",
       "captcha_id": "CAPTCHA_ID_FROM_PREVIOUS_RESPONSE"
     }'
   ```

3. **Signup**:
   ```bash
   curl -X POST "http://localhost:8000/v1/signup" \
     -F 'request_data={"first_name":"John","last_name":"Doe","email_id":"john@example.com","role":"customer","org":{"org_type":"Private Corporate Sector","org_name":"Test Corp","org_details":{"industry_type":"Information Technology (IT)","is_startup":false,"is_dpiit_certified":false,"is_interested_in_api_integration":false}},"tnc_url":"https://example.com/tnc"}'
   ```

## API Documentation

Once the server is running, visit:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## Security Features

- **Password Hashing**: Uses bcrypt for secure password storage
- **JWT Tokens**: Secure token-based authentication
- **Captcha Verification**: Prevents automated attacks
- **Input Validation**: Pydantic schemas for request validation
- **CORS Support**: Configurable cross-origin resource sharing

## Database Schema

### Users Table
- `id`: Primary key
- `first_name`, `last_name`: User names
- `email`: Unique email address
- `password_hash`: Hashed password
- `role`: User role (default: customer)
- `org_type`, `org_name`: Organization details
- `org_details`: JSON field for additional org info
- `is_fresh`, `is_profile_updated`, `is_existing_user`: User status flags
- `created_at`, `updated_at`: Timestamps

### Captchas Table
- `id`: Primary key
- `captcha_id`: Unique captcha identifier
- `captcha_text`: The text to be displayed
- `image_data`: Base64 encoded captcha image
- `created_at`: Creation timestamp
- `expires_at`: Expiration timestamp
- `is_used`: Whether captcha has been used

## Development

### Running in Development Mode
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Database Migrations
The application uses SQLAlchemy with automatic table creation. For production, consider using Alembic for database migrations.

## Production Deployment

1. **Environment Variables**: Set proper environment variables
2. **Database**: Use a production PostgreSQL instance
3. **Security**: Change default secret keys and passwords
4. **HTTPS**: Enable SSL/TLS in production
5. **CORS**: Configure CORS properly for your domain
6. **Monitoring**: Add logging and monitoring

## License

This project is part of the Adopter platform development.
