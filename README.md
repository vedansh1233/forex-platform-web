# FX Desk — Forex Platform Web

A React frontend for the [forex-platform](https://github.com/vedansh1233/forex-platform) Spring Boot API. Users sign up, get a $10,000 virtual USD wallet, follow live exchange rates and crypto prices, and trade between 8 major currencies and 5 cryptocurrencies. It is a portfolio demo: no real money is involved.

## Features

- **Live crypto ticker:** BTC, ETH, SOL, XRP and ADA prices streamed over a WebSocket. Prices flash green or red as they tick, and the app reconnects automatically (polling while the socket is down).
- **Markets:** a Forex view (latest rates for any base, plus price history) and a Crypto view (live prices with 24h change, plus a daily price chart). Charts cover 1M / 3M / 6M / 1Y and are hand-built SVG with a crosshair tooltip, keyboard navigation (← →), and a screen-reader data table.
- **Trade:** convert between any two assets at the live price, with 8-decimal precision for crypto. It shows a quote preview, a "use max" button and a balance check.
- **Limit orders:** "sell X when the rate reaches Y". The backend checks every 10 seconds and fills automatically; the order list shows how far each open order is from its target.
- **Price alerts:** "tell me when BTC/USD rises above 80,000". A bell badge counts new alerts, and a pop-up appears when one triggers.
- **Forex toolkit:**
  - Pip-value, position-size, profit/loss and converter calculators.
  - A cross-rate matrix of all pairs.
  - Currency-strength bars and a correlation heatmap.
  - A market-sessions clock (Sydney, Tokyo, London, New York).
- **Portfolio dashboard:** total value across every asset held (crypto valued live), balances, and recent activity.
- **Transaction history:** a paginated ledger of deposits, conversions and order fills.
- **Data source shown:** currency rates are European Central Bank reference rates, and crypto prices come from Coinbase. If a free source is down, the backend falls back to simulated prices, and the UI labels them clearly.
- **Auth:** register and log in with JWT; sessions survive reloads (`GET /api/user/me`); an expired or invalid token signs the user out automatically.
- **Error display:** backend validation errors appear under each form field.
- **Responsive dark UI:** a sidebar on desktop and an icon top bar on mobile.

**Roadmap:** a one-click demo login and a hosted live demo.

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

From the backend repo, this starts the API on an in-memory H2 database, with live ECB rates, live Coinbase crypto prices, and the background jobs (price streaming, limit orders, alerts) switched on. Data resets on restart.

```bash
./mvnw spring-boot:run -Dspring-boot.run.useTestClasspath=true "-Dspring-boot.run.arguments=--spring.datasource.url=jdbc:h2:mem:demo;MODE=PostgreSQL;DB_CLOSE_DELAY=-1 --spring.datasource.driver-class-name=org.h2.Driver --spring.datasource.username=sa --spring.datasource.password= --jwt.secret=local-demo-secret-key-at-least-32-bytes-long --app.rates.provider=frankfurter --app.crypto.provider=coinbase --app.scheduling.enabled=true"
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
  components/   Layout, route guards, UI primitives, RateChart (SVG), live prices (WebSocket provider,
                flashing prices), crypto markets, order list, alert bell, tools/ (calculators, matrices)
  hooks/        useCryptoPrices, useOrders, usePairSource
  pages/        Login, Register, Dashboard, Markets, Trade, Orders, Tools, History, Profile, 404
  lib/          Formatting, asset registry, forex math (fx.ts), transaction helpers
```
