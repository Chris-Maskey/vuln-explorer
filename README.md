# Vulnerability Explorer

A lightweight web interface for exploring security vulnerabilities using [OSV.dev](https://osv.dev) and [deps.dev](https://deps.dev).

Enter a CVE ID (e.g. `CVE-2021-44228`) to look up vulnerability details including affected packages, vulnerable version ranges, CVSS scores, aliases, and advisory links. Results are fetched live from the OSV and deps.dev APIs — no API key required.

## Quick Start (Local Development)

**Prerequisites:** Node.js, Docker

```bash
# Start all services (frontend, API, Redis)
docker-compose up --build

# Open http://localhost:3000
```

## Run Frontend Only

**Prerequisites:** Node.js

```bash
npm install
npm run dev
# Open http://localhost:3000
```

The frontend expects the API at `http://localhost:8000` by default. Override with:
```bash
VITE_API_URL=http://your-api-url npm run dev
```

## Run API Only (Python/FastAPI)

**Prerequisites:** Python 3.12+

```bash
cd api
pip install -r requirements.txt
uvicorn main:app --reload
# API runs at http://localhost:8000
```

## Project Structure

```
.
├── src/                         # React frontend (Vite)
│   ├── App.tsx                  # Page shell
│   ├── vulnerabilityLookup.ts   # OSV and deps.dev API layer
│   ├── vite-env.d.ts             # TypeScript env var types
│   └── vulnerability/
│       ├── useVulnerabilityLookup.ts
│       ├── formatters.ts
│       └── components/
├── api/                         # Python FastAPI backend
│   ├── main.py                  # FastAPI app with CORS
│   ├── config.py                # Settings (env vars)
│   ├── routers/proxy.py         # API endpoints
│   └── services/
│       ├── upstream.py          # OSV/deps.dev client
│       └── cache.py            # Redis caching
├── docker-compose.yml          # Full stack (frontend + API + Redis)
└── vite.config.ts
```

## Environment Variables

### Frontend (Vite)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8000` | API base URL |

### API (FastAPI)

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_URL` | `redis://localhost:6379` | Redis connection |
| `OSV_API_URL` | `https://api.osv.dev/v1` | OSV API endpoint |
| `DEPSDEV_API_URL` | `https://api.deps.dev/v3` | deps.dev API endpoint |
| `CORS_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000` | Allowed CORS origins (comma-separated) |

## APIs

- **[OSV.dev](https://osv.dev)** — primary source for vulnerability details, affected packages, and version ranges. No authentication required.
- **[deps.dev](https://deps.dev)** — enrichment layer for CVSS scores and advisory links. Fetched after OSV results and gracefully degrades if unavailable.

## Build

```bash
npm run build    # Production build to dist/
npm run lint     # TypeScript type check
```

## Deployment

### Railway (Backend + Redis)

1. Create a new Railway project
2. Add a **Redis** service (managed)
3. Add a **Python** service from your GitHub repo
   - Set Root Directory to `api`
   - Add environment variables:
     ```
     REDIS_URL=<reference to Railway Redis>
     OSV_API_URL=https://api.osv.dev/v1
     DEPSDEV_API_URL=https://api.deps.dev/v3
     CORS_ORIGINS=https://your-frontend.vercel.app
     ```
4. Generate a domain under **Networking** tab

### Vercel (Frontend)

1. Connect your GitHub repo to Vercel
2. Add environment variable:
   ```
   VITE_API_URL=https://your-railway-api.up.railway.app
   ```
3. Deploy
