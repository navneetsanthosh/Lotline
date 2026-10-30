# Lotline

Lotline is a considered auction marketplace for design pieces, art, collectibles and useful things with a story. It follows the structure you're learning: **Django REST Framework in `backend/` and React + Vite in `frontend/`**.

## What the current version demonstrates

- Search and category filtering across live, upcoming, ended and watched lots
- Account creation and token-based sign-in
- Seller listing creation and a personal watchlist
- Authenticated bids with minimum increments and protection against bidding on your own listing
- Anti-sniping rules: a valid bid in the final two minutes adds two minutes to the auction
- Bid history and countdowns
- Fictional local sample listings for exploring the interface

The sample photography is loaded from Unsplash URLs. Replace those URLs with properly licensed images or uploads before presenting this as a production marketplace. This is a portfolio MVP; it does not take payments, verify item authenticity, arrange shipping, or resolve disputes.

## Run locally on Windows

Use two PowerShell windows from the `lotline` folder.

### 1. Backend

```powershell
cd backend
py -3 -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
.\.venv\Scripts\python manage.py makemigrations auctions
.\.venv\Scripts\python manage.py migrate
.\.venv\Scripts\python manage.py seed_demo
.\.venv\Scripts\python manage.py runserver 127.0.0.1:8000
```

The local-only sample login is `demo` / `LocalOnly-Lotline-2026!`. The seller account is `studioform` with the same local-only password. Change or remove these credentials before any public deployment. You can create your own buyer account from the UI.

### 2. Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL, usually `http://127.0.0.1:5174/`. Vite proxies `/api` to Django on port 8001. If the backend is stopped, the frontend uses a clearly labeled preview catalog; bidding and account actions need the backend.

## API outline

- `GET /api/health/`
- `POST /api/auth/register/`
- `POST /api/auth/token/`
- `GET /api/me/`
- `GET, POST /api/auctions/`
- `GET /api/auctions/<id>/`
- `POST /api/auctions/<id>/bids/`
- `POST /api/auctions/<id>/watch/`

SQLite is used for local learning. PostgreSQL can be enabled with `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, and `POSTGRES_PORT`. Before a public deployment, use a private `DJANGO_SECRET_KEY`, turn `DJANGO_DEBUG` off, set production `DJANGO_ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS`, replace demo data and sample credentials, and choose appropriate image storage.
