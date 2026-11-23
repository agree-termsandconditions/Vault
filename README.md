# Campus Study Vault (Notes Space)

A high-performance, secure, multi-container campus study notes repository and document management system built with React, Bun, Tailwind CSS, and PostgreSQL 16.

---

## Architecture Overview

```
[ Host Firewall: Ports 80, 443, 3000 ]
           │
           ▼
┌──────────────────────────────────────────────┐
│  campus-study-vault (Notes Space Container)   │
│  - React 19 Frontend + Vite Build            │
│  - Bun Low-Latency API Server (AES-256)      │
│  - Ports: 80 (HTTP), 443 (HTTPS), 3000       │
└──────────────────────┬───────────────────────┘
                       │
       Internal Docker Bridge Network
       (campus-network - isolated)
                       │
                       ▼
┌──────────────────────────────────────────────┐
│  campus-shared-db (PostgreSQL 16 Engine)     │
│  - Database: shared_user_db                  │
│  - Database: notespace_logs_db               │
│  - Port 5432: Isolated (No Host Exposure)    │
└──────────────────────────────────────────────┘
```

---

## Production Deployment (Real-World DevOps Runbook)

### 1. Prerequisites
- **Operating System:** Linux (Ubuntu 22.04 / 24.04 LTS recommended) or Docker Desktop
- **Runtime:** Docker Engine 24+ & Docker Compose v2+
- **Domain & DNS:** Point your `A` record (e.g. `akish.online`) to your server public IP

### 2. Clone the Repository
```bash
git clone https://github.com/agree-termsandconditions/Vault.git notespace
cd notespace
```

### 3. Configure Secrets (`.env`)
Copy the production environment template:
```bash
cp .env.production.example .env
```
Edit `.env` and set your production secrets:
```ini
DB_PASSWORD="your_strong_postgres_password"
SESSION_SECRET="64_char_random_hex_string_for_hmac_signatures"
APP_URL="https://akish.online"
GEMINI_API_KEY=""
```

### 4. Install SSL/TLS Certificates
Place your domain SSL certificates into `./certs/`:
```bash
# Example if using Let's Encrypt / Certbot:
sudo cp /etc/letsencrypt/live/akish.online/fullchain.pem ./certs/fullchain.pem
sudo cp /etc/letsencrypt/live/akish.online/privkey.pem ./certs/privkey.pem
sudo chmod 600 ./certs/privkey.pem
```

### 5. Launch the Stack
```bash
# Build production images and start in detached mode
docker compose up -d --build notespace shared-db
```

### 6. Verify Deployment
```bash
# Verify containers are healthy
docker compose ps

# Check API health
curl -s http://localhost:3000/api/files
# Response: {"success":true,"files":[]}

# Check HTTPS response and HSTS header
curl -k -I https://localhost/
```

---

## Security & Hardening Highlights
- **OWASP Top 10:2025 Compliant:** Patched access control, injection sanitization, SSRF filters, constant-time HMAC comparisons, and prototype pollution guards.
- **Network Isolation:** PostgreSQL port `5432` has zero host exposure, restricted to the internal Docker bridge network.
- **Container Hardening:** Containers run with `no-new-privileges:true` defense-in-depth flags.
- **Zero Secret Commits:** Strict `.gitignore` and `.dockerignore` prevent certificates, SQLite databases, user uploads, and `.env` files from leaking.
