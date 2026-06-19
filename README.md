# my-store

Multi-tenant Shopify-style store builder for Pakistan. Store owners create their
own storefront, pick a type (cosmetics / clothing / electronics) and theme, manage
products, and take cash-on-delivery orders.

## Stack
- **Backend:** Node.js + Express + MongoDB (Mongoose) — `backend/`
- **Frontend:** Next.js (App Router) — `frontend/`

## Run locally
Requires Node 20+ and a local MongoDB.

```bash
# backend (http://localhost:4000)
cd backend && npm install && cp .env.example .env && npm run dev

# frontend (http://localhost:3000) — in a second terminal
cd frontend && npm install && cp .env.example .env.local && npm run dev
```

Seed a demo store: `cd backend && npm run seed`
