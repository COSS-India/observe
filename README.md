# AI4Voice Portal

A comprehensive monorepo containing both frontend and backend applications for the AI4Voice Portal project.

## Project Structure

```
AI4Voice_Portal/
├── app/                    # Next.js Frontend Application
├── components/             # React Components
├── hooks/                  # Custom React Hooks
├── lib/                    # Frontend Utilities & API Clients
├── types/                  # TypeScript Type Definitions
├── backend/                # Backend Services
│   └── Obs-Bhashini-Login/ # FastAPI Authentication Service
├── package.json            # Frontend Dependencies
├── next.config.ts          # Next.js Configuration
└── README.md               # This file
```

## Frontend (Next.js)

The frontend is a Next.js application providing a Grafana administration portal with user management, dashboard management, and organization features.

### Frontend Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

4. **Open in browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Frontend Features

- **Grafana Integration**: Manage dashboards, folders, teams, and users
- **User Management**: Create, edit, and manage user accounts
- **Organization Management**: Handle multiple organizations
- **Team Management**: Organize users into teams
- **Dashboard Management**: View and organize Grafana dashboards
- **Modern UI**: Built with Tailwind CSS and Radix UI components

## Backend (FastAPI)

The backend provides authentication services with Bhashini integration, including captcha verification and JWT-based authentication.

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend/Obs-Bhashini-Login
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

5. **Initialize database:**
   ```bash
   python init_db.py
   ```

6. **Run the server:**
   ```bash
   python -m uvicorn app.main:app --reload
   ```

7. **Access API documentation:**
   Navigate to [http://localhost:8000/docs](http://localhost:8000/docs)

### Backend Features

- **User Authentication**: Signin and signup functionality
- **Captcha Integration**: Image-based captcha for login security
- **JWT Tokens**: Secure token-based authentication
- **PostgreSQL Database**: Robust data persistence
- **RESTful API**: Clean and well-documented API endpoints
- **Email Services**: User verification and notifications

## Development Workflow

### Running Both Services

1. **Terminal 1 - Backend:**
   ```bash
   cd backend/Obs-Bhashini-Login
   source venv/bin/activate
   python -m uvicorn app.main:app --reload --port 8000
   ```

2. **Terminal 2 - Frontend:**
   ```bash
   npm run dev
   ```

### Environment Configuration

#### Frontend Environment Variables

1. **Create environment file:**
   ```bash
   # Create .env.local file manually
   touch .env.local
   ```

2. **Required variables for development:**
   ```bash
   BACKEND_URL=http://localhost:8000
   NEXT_PUBLIC_GRAFANA_URL=http://localhost:3001
   GRAFANA_API_KEY=your_grafana_api_key_here
   NEXTAUTH_SECRET=your_nextauth_secret_here
   NEXTAUTH_URL=http://localhost:3000
   ```

3. **For production deployment:**
   - Set environment variables in your deployment platform (Vercel, Netlify, etc.)
   - Update `BACKEND_URL` to your production backend URL
   - Update `NEXT_PUBLIC_GRAFANA_URL` to your production Grafana URL
   - Use production API keys and secrets

#### Backend Environment Variables
- **Backend**: Uses Python environment variables (`.env` in backend folder)

## API Integration

The frontend communicates with the backend through REST API calls. The backend provides authentication endpoints that the frontend uses for user management.

## Deployment

### Frontend Deployment
- Deploy to Vercel, Netlify, or any Next.js-compatible platform
- Set environment variables in your deployment platform

### Backend Deployment
- Deploy to platforms like Railway, Heroku, or AWS
- Configure database connection and environment variables
- Ensure PostgreSQL database is accessible

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test both frontend and backend
5. Submit a pull request

## License

This project is part of the COSS AI4X initiative.
