# FX Desk — Forex Platform Web

A React frontend for the [forex-platform](https://github.com/vedansh1233/forex-platform) Spring Boot API. Users sign up, get a $10,000 virtual USD wallet, and (soon) trade currencies with it. It is a portfolio demo: no real money is involved.

## Features

- Register and log in with JWT authentication; sessions survive reloads (`GET /api/user/me`)
- Protected routes; an expired or invalid token automatically signs the user out
- Dashboard with a demo wallet: create it, then see the balance
- Profile page
- Validation errors from the backend shown under each form field
- Responsive dark UI (sidebar on desktop, top bar on mobile)

**Roadmap:** live exchange rates and charts, currency conversion and trading, transaction history, and a real-time WebSocket price ticker.

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · TanStack Query · React Router · lucide-react

## Getting started

Prerequisites: Node.js 20+ and the [backend](https://github.com/vedansh1233/forex-platform) running on `http://localhost:8080`.

```bash
npm install
npm run dev        # http://localhost:5173
```

To point at a different backend, copy `.env.example` to `.env.local` and set `VITE_API_URL`. The backend must allow this app's origin in `CORS_ALLOWED_ORIGINS`.

### Running the backend without PostgreSQL (quick demo)

From the backend repo, this starts the API on an in-memory H2 database. Data resets on restart.

```bash
./mvnw spring-boot:run -Dspring-boot.run.useTestClasspath=true "-Dspring-boot.run.arguments=--spring.datasource.url=jdbc:h2:mem:demo;MODE=PostgreSQL --spring.datasource.driver-class-name=org.h2.Driver --spring.datasource.username=sa --spring.datasource.password= --spring.jpa.hibernate.ddl-auto=create-drop --jwt.secret=local-demo-secret-key-at-least-32-bytes-long"
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Lint with oxlint |

## Project structure

```
src/
  api/          HTTP client (token header, error parsing, 401 handling), endpoints, types
  auth/         AuthProvider (session state) and useAuth hook
  components/   Layout, route guards, UI primitives
  pages/        Login, Register, Dashboard, Profile, 404
  lib/          Formatting helpers
```
