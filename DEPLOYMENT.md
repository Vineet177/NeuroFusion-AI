# 🚀 NeuroFusion AI — Production Deployment Guide

This guide provides end-to-end instructions for deploying the **NeuroFusion AI** multi-modal clinical intelligence platform.

---

## 🏗️ Architecture Overview

| Component | Technology | Production Role |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite, TailwindCSS | SPA dashboard, charts, MRI/EEG viewing |
| **Backend** | FastAPI, PyTorch (ResNet18 + EEG 1D-CNN) | REST API, authentication, neural inference |
| **Database** | PostgreSQL or MySQL | User accounts, patient records, metadata |
| **Storage** | Persistent Volume / Local Mount (`/uploads`) | Doctor photos, uploaded DICOM/NIfTI/EEG scans |

---

## Option 1: Cloud Deployment (Vercel + Render) ⚡ *(Recommended)*

This is the fastest, free-tier-friendly way to get NeuroFusion AI running live on the internet.

### Step 1: Deploy Backend & Database on Render

1. Push your repository to **GitHub**:
   ```bash
   git add .
   git commit -m "Add production deployment configurations"
   git push origin main
   ```
2. Log in to [Render.com](https://render.com).
3. Click **New +** > **Blueprint** (or **Web Service**).
4. Connect your `NeuroFusion-AI` repository. Render will automatically detect [`render.yaml`](./render.yaml).
5. Render will provision:
   - **PostgreSQL Database** (`neurofusion-db`)
   - **FastAPI Web Service** (`neurofusion-backend`) with CPU-optimized PyTorch.
6. Once deployed, copy your backend URL (e.g., `https://neurofusion-backend.onrender.com`).
7. Verify health: visit `https://neurofusion-backend.onrender.com/health` (should return `"status": "online"`).

---

### Step 2: Deploy Frontend on Vercel

1. Log in to [Vercel.com](https://vercel.com).
2. Click **Add New...** > **Project**.
3. Import your `NeuroFusion-AI` GitHub repository.
4. Configure Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend` *(Click Edit and select the `frontend` folder)*
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Under **Environment Variables**, add:
   - `VITE_API_BASE_URL` = `https://neurofusion-backend.onrender.com` *(your Render backend URL)*
   - `VITE_GOOGLE_CLIENT_ID` = *(Optional, your Google OAuth Client ID)*
6. Click **Deploy**.
7. In Render backend settings, update the `FRONTEND_URL` environment variable to your new Vercel domain (e.g., `https://neurofusion.vercel.app`).

---

## Option 2: Docker & Docker Compose 🐳 *(Self-Hosted / VPS)*

Use Docker to deploy the full stack on any VPS (AWS EC2, DigitalOcean Droplet, GCP Compute Engine, Hetzner, etc.) or locally with one command.

### Prerequisites
- Docker Engine 24+ & Docker Compose v2+ installed.

### Deploying with Docker Compose

1. Clone repository on the server:
   ```bash
   git clone https://github.com/Vineet177/NeuroFusion-AI.git
   cd "NeuroFusion-AI"
   ```

2. *(Optional)* Create a `.env` file in the root to customize secrets:
   ```env
   POSTGRES_USER=neurofusion
   POSTGRES_PASSWORD=your_strong_password_here
   POSTGRES_DB=neurofusion
   SECRET_KEY=generate_a_random_64_char_secret_key
   FRONTEND_PORT=80
   DB_PORT=5432
   ```

3. Launch all services:
   ```bash
   docker compose up -d --build
   ```

4. Verify running containers:
   ```bash
   docker compose ps
   ```
   You should see:
   - `neurofusion_db` (Port 5432)
   - `neurofusion_backend` (Port 8000)
   - `neurofusion_frontend` (Port 80)

5. Access your deployment:
   - **Frontend**: `http://<your-server-ip>`
   - **Backend API Docs**: `http://<your-server-ip>:8000/docs`
   - **Health Check**: `http://<your-server-ip>:8000/health`

---

## Option 3: Deploying on Railway 🚂

1. Create a project on [Railway.app](https://railway.app).
2. Click **Add Service** > **Database** > **PostgreSQL**.
3. Click **Add Service** > **GitHub Repo** > Select `NeuroFusion-AI`.
   - Set **Root Directory**: `/backend`
   - Set **Build Command**:
     ```bash
     pip install --upgrade pip && pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu && pip install -r requirements.txt
     ```
   - Set **Start Command**:
     ```bash
     uvicorn main:app --host 0.0.0.0 --port $PORT
     ```
   - In Variables, reference the Postgres database:
     - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
     - `SECRET_KEY` = `your_super_secret_key`
     - `CORS_ORIGINS` = `["*"]`
4. Add another service for Frontend:
   - Set **Root Directory**: `/frontend`
   - Set Environment Variable `VITE_API_BASE_URL` to the Railway backend domain.

---

## Option 4: Linux VPS Native Deployment (Systemd + Nginx)

If you prefer deploying directly on an Ubuntu/Debian server without Docker:

### 1. Backend (Systemd Service)

Create `/etc/systemd/system/neurofusion.service`:
```ini
[Unit]
Description=NeuroFusion AI FastAPI Backend
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/var/www/neurofusion/backend
Environment="PATH=/var/www/neurofusion/backend/venv/bin"
EnvironmentFile=/var/www/neurofusion/backend/.env
ExecStart=/var/www/neurofusion/backend/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000 --workers 4
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now neurofusion
```

### 2. Frontend (Nginx Reverse Proxy & Static Files)

Build frontend:
```bash
cd /var/www/neurofusion/frontend
VITE_API_BASE_URL=https://api.yourdomain.com npm run build
```

Configure Nginx site `/etc/nginx/sites-available/neurofusion`:
```nginx
server {
    server_name yourdomain.com;

    root /var/www/neurofusion/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 100M;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:8000/uploads/;
        proxy_set_header Host $host;
    }
}
```

Enable SSL using Let's Encrypt Certbot:
```bash
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

---

## ⚙️ Environment Variables Reference

### Backend (`backend/.env`)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | Async connection string (Postgres/MySQL) | `postgresql+asyncpg://user:pass@host:5432/db` |
| `SECRET_KEY` | Cryptographic secret for JWT authentication | `long-random-hex-string` |
| `ALGORITHM` | JWT signing algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifespan | `60` |
| `FRONTEND_URL` | URL of deployed frontend | `https://neurofusion.vercel.app` |
| `CORS_ORIGINS` | JSON list of allowed origins | `["https://neurofusion.vercel.app"]` |
| `SMS_MODE` | SMS delivery mode | `development` or `production` |
| `SMS_PROVIDER` | SMS vendor | `development`, `fast2sms`, `twilio` |

### Frontend (`frontend/.env`)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | URL to the FastAPI backend | `https://api.yourdomain.com` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID | `*.apps.googleusercontent.com` |

---

## 🛡️ Pre-Flight Verification Checklist

- [x] PyTorch model weights present in `backend/app/trained_models/`:
  - `dementia_resnet18.pth` (~90 MB)
  - `best_eeg_model.pth` (~3.1 MB)
- [x] CORS middleware updated to allow HTTPS and configurable domain names.
- [x] Dynamic database URL parsing for `postgresql://` and `postgres://` connection strings.
- [x] Frontend dynamic image URLs bound to `API_BASE_URL`.
- [x] Upload storage directories (`uploads/avatars`, `uploads/mri`, `uploads/eeg`) configured with persistent volumes.
