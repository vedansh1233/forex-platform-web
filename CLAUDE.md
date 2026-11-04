# CLAUDE.md

This file guides Claude Code (claude.ai/code) when working in this repository.

## Project overview

`forex-platform-web` ("FX Desk") is the React frontend for the `forex-platform` Spring Boot backend. That backend lives in a separate repo, in the sibling folder `../forex-platform`. Its `CLAUDE.md` holds the authoritative API contract. This is a portfolio demo of a forex trading app; users get a virtual $10,000 USD wallet.

## Commands

Node.js is installed at `C:\Program Files\nodejs`. If `node` isn't on PATH in a shell, prepend that folder.

```bash
npm run dev       # dev server on http://localhost:5173 (strictPort; backend CORS allows this origin)
npm run build     # tsc -b + vite build (this is also the typecheck)
npm run lint      # oxlint
```

There is no test runner yet.

The backend URL comes from `VITE_API_URL` (default `http://localhost:8080`; see `.env.example`). The README shows how to run the backend on in-memory H2 without PostgreSQL.

## Architecture

- `src/api/client.ts`: the single `request()` helper. It adds `Authorization: Bearer`, parses the backend's `ErrorResponse` into `ApiError {status, message, fieldErrors}`, and calls the registered unauthorized handler on a 401 *only when a token was sent*, so a failed login doesn't log anyone out. The token lives in `localStorage` under `fxdesk.token`.
- `src/api/endpoints.ts` and `types.ts`: one function per backend endpoint, with types mirroring the backend DTOs. Keep them in sync when the backend changes.
- `src/auth/`: `AuthProvider` derives `status` (`loading` / `authenticated` / `anonymous`) from the token plus a TanStack Query `['me']` query. Login and register put the returned user straight into that cache. The context object lives in `authContextValue.ts`, separate from the provider component, to keep fast refresh working.
- `src/components/RouteGuards.tsx`: `RequireAuth` / `RequireGuest` layout routes. Routing is defined in `App.tsx` (`createBrowserRouter`, react-router v8).
- Server state goes through TanStack Query. All query keys come from `queryKeys` in `src/api/endpoints.ts`. After a conversion, write the returned wallet into `queryKeys.wallet` and invalidate `queryKeys.transactions` (the prefix covers every page). On wallet queries, a 404 means "no wallet yet" and is not retried. There is no global state library.
- Pages: `Dashboard` (portfolio total, holdings, recent activity), `Markets` (rates list + `RateChart`), `Trade` (convert form; reads `?from=&to=` from the URL), `History` (paginated table), and `Profile`.
- `components/RateChart.tsx` is a dependency-free SVG chart. It follows the dataviz rules: one 2px line, a ~10% area wash, hairline solid gridlines, an end dot, a crosshair tooltip on pointer or ← → keys, and an `sr-only` table. Keep it single-series.
- Rates carry `source: "ECB" | "SIMULATED"`. Always show `SourceBadge` next to rates, so simulated data is never presented as real.

## Conventions

- TypeScript is strict, with `verbatimModuleSyntax` (use `import type`) and `erasableSyntaxOnly` (no enums, no constructor parameter properties).
- Styling uses Tailwind v4 utilities only. Theme tokens (`ink-*`, `accent-*`, fonts) live in `src/index.css` under `@theme`. Reuse the primitives in `components/ui.tsx` (`Button`, `Field`, `Card`, `ErrorAlert`).
- Show backend validation with `Field error={apiError.fieldErrors.<field>}`. Show the general `ErrorAlert` only when there are no field errors.
- Icons come from `lucide-react`, with `aria-hidden` on decorative ones.
