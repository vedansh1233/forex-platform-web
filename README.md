# FX Desk — Forex Platform Web

A React frontend for the [forex-platform](https://github.com/vedansh1233/forex-platform) Spring Boot API. Users sign up, get a $10,000 virtual USD wallet, follow live exchange rates, and trade between 8 major currencies. It is a portfolio demo: no real money is involved.

## Features

- **Markets:** latest rates for any base currency, plus an interactive price-history chart (1M / 3M / 6M / 1Y). The chart is a hand-built SVG with a crosshair tooltip, keyboard navigation (← →), and a screen-reader data table.
- **Trade:** convert between USD, EUR, GBP, JPY, CHF, CAD, AUD and NZD. Shows a live quote preview, a "use max" button and a balance check.
- **Portfolio dashboard:** total value across every currency held, per-currency balances, and recent activity.
- **Transaction history:** a paginated ledger of deposits and conversions.
- **Data source shown:** rates are European Central Bank reference rates. If the free rates API is down, the backend falls back to simulated rates, and the UI labels them clearly.
- **Auth:** register and log in with JWT; sessions survive reloads (`GET /api/user/me`); an expired or invalid token signs the user out automatically.
- **Error display:** backend validation errors appear under each form field.
- **Responsive dark UI:** a sidebar on desktop and an icon top bar on mobile.

**Roadmap:** a real-time WebSocket price ticker and a one-click demo login.

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
  components/   Layout, route guards, UI primitives, RateChart (SVG), SourceBadge
  pages/        Login, Register, Dashboard, Markets, Trade, History, Profile, 404
  lib/          Formatting, currency names, transaction helpers
```
