# Observe Portal – Setup Guide

## Overview

A standalone observability interface that can be deployed by Organisations who already have metrics available and need multi-tenant visualization, and administrative control over dashboards and access.

## What You'll Get

- **Grafana Integration**: Centralized dashboard, folder, team, and user management
- **Organization Management**: Multi-tenant support for different organizations
- **Team Management**: Organize users into teams with specific access levels
- **Secure Authentication**: Adopter-integrated authentication with captcha and JWT tokens
- **Modern Interface**: Clean, responsive UI built with Next.js and Tailwind CSS

## Architecture

The portal consists of two main components:

1. **Frontend (Next.js)**: Web interface for portal administration — runs on **port 3005**
2. **Backend (FastAPI)**: Authentication service with PostgreSQL database — runs on **port 9010**

---

## Prerequisites

Before you begin, ensure you have the following installed:

### System Requirements

- **[Node.js](https://nodejs.org/en/download)**: Version 16.x or higher (LTS recommended)
- **[Python](https://www.python.org/downloads/)**: Version 3.8 or higher (`python3`)
- **[PostgreSQL](https://www.postgresql.org/download/)**: Version 12 or higher
- **[Grafana](https://grafana.com/grafana/download)**: Version 8.x or higher (running instance)
- **[Git](https://git-scm.com/downloads)**: For cloning the repository

### Required Access

- Admin access to a running Grafana instance
- PostgreSQL database with create privileges
- Email service credentials (for user notifications)

---

## Project Structure

```
observe/
├── app/                    # Next.js Frontend Application
├── components/             # React Components
├── hooks/                  # Custom React Hooks
├── lib/                    # Frontend Utilities & API Clients
├── types/                  # TypeScript Type Definitions
├── backend/                # Backend Services
│   ├── app/                # FastAPI Application Package
│   ├── requirements.txt    # Python Dependencies  ← lives here
│   ├── env.example         # Environment template  ← lives here
│   ├── init_db.py          # Database init script  ← lives here
│   └── run.sh              # Quick-start script
├── package.json            # Frontend Dependencies
└── next.config.ts          # Next.js Configuration
```

---

## Quick Start Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/COSS-India/observe.git
cd observe
```

---

### Step 2: Set Up the Backend (Authentication Service)

#### 2.1 Navigate to the Backend Directory

> **Important:** All backend commands must be run from the `backend/` directory, **not** `backend/app/`.
> The `requirements.txt`, `env.example`, and `init_db.py` files all live in `backend/`.

```bash
cd backend
```

#### 2.2 Create Python Virtual Environment

> **Linux/macOS:** Use `python3` (not `python`).

```bash
python3 -m venv venv
source venv/bin/activate
```

**On Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

#### 2.3 Install Python Dependencies

Make sure you are still in the `backend/` directory (where `requirements.txt` is located):

```bash
pip install -r requirements.txt
```

#### 2.4 Set Up the PostgreSQL Database

Do this **before** editing `.env` — the password you choose here is what you will put into `DATABASE_URL`.

Ensure PostgreSQL is running, then create a dedicated user and database:

```bash
# Connect to PostgreSQL as the superuser
sudo -u postgres psql
```

Inside the `psql` prompt, run:

```sql
CREATE USER observe_user WITH PASSWORD 'observe_pass';
CREATE DATABASE observe_db OWNER observe_user;
GRANT ALL PRIVILEGES ON DATABASE observe_db TO observe_user;
\q
```

> You can choose any username and password you like — just make sure the values you use here
> are the same ones you put in `DATABASE_URL` in the next step.

#### 2.5 Configure Environment Variables

Copy the example env file:

```bash
cp env.example .env
```

Open `.env` and update the `DATABASE_URL` with the credentials you just created in PostgreSQL:

```env
# Replace observe_user / observe_pass with whatever you used in the CREATE USER step above
DATABASE_URL=postgresql://observe_user:observe_pass@localhost:5432/observe_db
```

The rest of the file has sensible defaults. The only other values to update are your email credentials if you want the email service to work:

```env
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

#### 2.6 Initialize the Database

Run `init_db.py` from the `backend/` directory (where the script lives):

```bash
python3 init_db.py
```

This creates the necessary database tables and a sample test user.

If successful, you will see:

```
Initializing Adopter Login API Database...
==================================================
Creating database tables...
Database tables created successfully!
Sample user created successfully!
Email: test@karmayogi.in
Password: test1234
==================================================
Database initialization completed successfully!
```

#### 2.7 Start the Backend Server

```bash
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 9010
```

The backend API will be available at `http://localhost:9010`

You can view the API documentation at `http://localhost:9010/docs`

> **Tip:** Alternatively, use the provided helper script (runs all steps 2.2–2.7 automatically):
> ```bash
> bash run.sh
> ```

---

### Step 3: Set Up the Frontend (Portal Interface)

#### 3.1 Return to Root Directory

```bash
cd ..   # Back to the observe root directory
```

#### 3.2 Install Node Dependencies

```bash
npm install
```

#### 3.3 Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
touch .env.local
```

Add the following configuration:

```env
# Backend API URL  (server-side: no NEXT_PUBLIC_ prefix)
BACKEND_URL=http://localhost:9010

# Grafana Configuration
NEXT_PUBLIC_GRAFANA_URL=http://localhost:3000

# Grafana Basic Auth (preferred — works across all orgs with admin privileges)
GRAFANA_USERNAME=admin
GRAFANA_PASSWORD=your_grafana_admin_password

# Grafana API Key (optional fallback — may be org-scoped)
GRAFANA_API_KEY=your_grafana_api_key_here

# NextAuth Configuration
NEXTAUTH_SECRET=generate-a-random-secret-here
NEXTAUTH_URL=http://localhost:3005
```

**Generate `NEXTAUTH_SECRET`:**
```bash
openssl rand -base64 32
```

**How to get Grafana API Key (if using API key auth):**
1. Log in to your Grafana instance
2. Go to **Configuration → API Keys**
3. Click **New API Key**
4. Set name as "Observe Portal" with **Admin** role
5. Copy the generated key

#### 3.4 Start the Development Server

```bash
npm run dev
```

The frontend will be available at **`http://localhost:3005`** (not 3000 — the dev script is configured to use port 3005).

---

### Step 4: Verify Installation

1. **Check Backend**: Visit `http://localhost:9010/docs` — you should see the FastAPI API documentation
2. **Check Frontend**: Visit `http://localhost:3005` — you should see the login page
3. **Check Grafana**: Ensure your Grafana instance is running at the configured URL

---

## First Time Setup

### Sample User (Created by init_db.py)

A test user is automatically created during database initialization:

| Field    | Value                 |
|----------|-----------------------|
| Email    | `test@example.in`     |
| Password | `test1234`            |
| Role     | `customer`            |

### Connect to Grafana

The platform connects to Grafana using the credentials you configured in `.env.local`. You should be able to:

- View existing Grafana organizations
- Manage users and teams
- Create and organize dashboards
- Set up role-based access controls

---

## Next Steps After Successful Setup

Once the platform is running and connected to Grafana, you can begin onboarding your teams and organizing access.

### User Onboarding

- Create user accounts for your team members.
- Assign appropriate roles (e.g., Super Admin, Org Admin, Team Member).
- Ensure users can log in and access their assigned dashboards.

### Dashboard & Monitoring Configuration

- Import or create Grafana dashboards relevant to your organization.
- Group dashboards into logical folders for easier navigation.
- Set up monitoring and alerting for the Observe platform itself (backend, frontend, and database health).

### Backup Strategy

- Configure and schedule **regular database backups** (see the **Maintenance → Database Backups** section below for reference commands).
- Store backups securely and periodically test restore procedures.

---

## Team and Dashboard Provisioning (Super Admin)

Super Admins are responsible for mapping organizations, teams, folders, and dashboards to enforce proper access control.

### Team Creation

- Navigate to the **Team Management** page.
- Click on the **Create Team** button.
- Fill in the team details (e.g., **name**, **email**) and submit the form.
- The newly created team will be associated with the selected organization, enabling better hierarchy and management of users.

### Folder and Dashboard Management

Super Admins can provision dashboards for teams by creating folders, assigning teams to those folders, and adding dashboards.

#### Creating Folders

- Navigate to the **Folder Management** page.
- Click on the **Create Folder** button.
- Provide a title for the folder and submit the form.

#### Assigning Teams to Folders

- From the **Folder Management** page, select a folder.
- Use the **Manage Teams** option to assign teams to the folder.
- Choose the team and set the appropriate permissions: **View**, **Edit**, or **Admin**.

#### Adding Dashboards to Folders

- From the **Folder Management** page, select a folder.
- Use the **Manage Dashboards** option to add dashboards to the folder.
- Select dashboards from the list and assign them to the folder for quick access by the mapped teams.

### Key Features of Provisioning

- **Team Mapping**: Teams are mapped to organizations for better hierarchy and management.
- **Folder Permissions**: Teams can be granted specific permissions (**View**, **Edit**, **Admin**) per folder.
- **Dashboard Organization**: Dashboards can be grouped into folders for secure, efficient access and management.

This setup ensures that dashboards are securely and efficiently provisioned to the right teams, enabling seamless collaboration and fine-grained access control.

---

## Troubleshooting

### `psycopg2.OperationalError: fe_sendauth: no password supplied`

**Cause:** The `DATABASE_URL` in `.env` is missing a password (e.g., `postgresql://postgres:@localhost...`).

**Fix:** Supply a valid PostgreSQL username and password:

```env
DATABASE_URL=postgresql://observe_user:your_password@localhost:5432/observe_db
```

### `pip install`: `No such file or directory: 'requirements.txt'`

**Cause:** You ran `pip install -r requirements.txt` from inside `backend/app/` instead of `backend/`.

**Fix:** Make sure you are in the `backend/` directory:

```bash
cd backend          # ← correct directory
pip install -r requirements.txt
```

### `python: command not found` (Linux)

**Cause:** On modern Linux systems, the Python 3 binary is named `python3`.

**Fix:** Use `python3` everywhere:

```bash
python3 -m venv venv
python3 init_db.py
python3 -m uvicorn app.main:app --reload --port 9010
```

### Database Connection Error

- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Confirm the database exists: `psql -U observe_user -d observe_db -c '\l'`
- Check `DATABASE_URL` format: `postgresql://user:password@host:port/dbname`

### Port Already in Use

```bash
# Find the process using the port
lsof -i :9010
# Kill it
kill -9 <PID>
```

### Frontend: Environment Variables Not Loading

- Ensure `.env.local` is in the **root** `observe/` directory (not inside `backend/`)
- Restart the development server after any changes to `.env.local`
- Variables accessible in the browser **must** start with `NEXT_PUBLIC_`

### Grafana Connection Failed

- Verify the Grafana URL is reachable from your machine
- Confirm `GRAFANA_USERNAME` / `GRAFANA_PASSWORD` are correct
- Ensure the Grafana admin account has the **Admin** role
- Check CORS settings in Grafana to allow requests from `http://localhost:3005`

---

## Production Deployment

### Backend

#### Option 1: Docker (Recommended)

Create a `Dockerfile` in the `backend/` directory:

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "9010"]
```

Build and run:
```bash
docker build -t observe-backend .
docker run -p 9010:9010 --env-file .env observe-backend
```

#### Option 2: Systemd / Direct

```bash
uvicorn app.main:app --host 0.0.0.0 --port 9010 --workers 4
```

### Frontend

#### Option 1: Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in the Vercel dashboard:
   - `BACKEND_URL` — your production backend URL
   - `NEXT_PUBLIC_GRAFANA_URL` — your Grafana URL
   - `GRAFANA_USERNAME` / `GRAFANA_PASSWORD` — Grafana admin credentials
   - `GRAFANA_API_KEY` — optional Grafana API key
   - `NEXTAUTH_SECRET` — random secret
   - `NEXTAUTH_URL` — your production domain
4. Deploy

#### Option 2: Self-hosted

```bash
npm run build
npm start
```

Use nginx as a reverse proxy:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Database Setup for Production

Use a managed PostgreSQL service:

- **AWS RDS** — enterprise deployments
- **DigitalOcean Managed Databases** — cost-effective
- **Supabase** — modern alternative with extra features

Update `DATABASE_URL` in your backend `.env` file with the production connection string.

---

## Maintenance

### Update Dependencies

```bash
# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt --upgrade

# Frontend
cd ..
npm update
```

### Database Backups

```bash
# Backup
pg_dump -U observe_user -d observe_db > backup_$(date +%Y%m%d).sql

# Restore
psql -U observe_user -d observe_db < backup_20240101.sql
```

---
