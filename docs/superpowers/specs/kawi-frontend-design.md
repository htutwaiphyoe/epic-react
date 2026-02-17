# Kawi Frontend — Design

**Status:** Approved for planning

## Purpose

A single web application serving two audiences against the existing `kawi-backend` REST API:

- **Customers** (`user`) — browse and search the book catalog, place orders, review books they bought, manage their account
- **Catalog managers** (`publisher`, `admin`) — a console for managing books, authors, and (admin only) orders and users

One codebase, one session, one navigation model. Which surface a person sees is derived from the `role` claim in their access token.

## Scope

**In scope for v1:** the full storefront (catalog, search, auth, cart, checkout, order history, reviews) and the full console (books, authors, orders, users) with capability gating across all three roles.

**Deliberately out of scope:**

- **Server-side cart.** The API has no cart resource; `POST /api/v1/orders` accepts the complete item list in one call. v1 keeps the cart in `localStorage`. A future `carts` resource is planned — the checkout boundary is designed so it can be swapped in without touching UI components.
- **Payments.** Orders transition `pending → paid` via an admin action, not a payment provider.
- **HTTPS/custom domain.** The API is currently reachable over plain HTTP at an ephemeral Fargate IP. Not blocking, but see *Configuration*.

## Stack

| Concern | Choice |
|---|---|
| Framework | TanStack Start (React), TypeScript, Vite plugin |
| Routing | TanStack Router (file-based, bundled with Start) |
| Server state | TanStack Query v5 |
| Forms | TanStack Form + Zod v4 |
| Tables | TanStack Table |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui |
| Unit / integration | Vitest + MSW |
| E2E | Playwright |

**Version pinning is required.** TanStack Start is pre-1.0 — the RC API is declared stable and preparing for 1.0, but exact versions must be pinned in `package.json` and upgraded deliberately, not via ranges.

Zod v4 matches the backend's `zod ^4.4.3`, so validation rules can be mirrored rather than reinvented.

## Architecture

### Data access — every call goes through a server function

All reads and writes to the kawi API happen inside `createServerFn` handlers. The browser never contacts the kawi API directly.

```text
browser ──(same-origin RPC)──▶ Start server fn ──(Bearer)──▶ kawi API
```

This yields four properties:

1. **Data fetching is always server-side.** A TanStack Router `loader` runs on the server for the initial request but in the browser for client-side navigations. Because loaders call server functions rather than `fetch`, the actual API call happens on the server either way. Note this is about *where data is fetched*, not *where HTML is rendered* — see [Rendering strategy](#rendering-strategy) for the latter, which is decided per route.
2. **No CORS surface.** Same-origin RPC means `CORS_ORIGIN` on the backend never needs configuring, including for preview deployments with generated hostnames.
3. **Tokens never reach JavaScript.** They live in the Start session cookie, readable only server-side.
4. **One data-access pattern.** Error normalization, token refresh, and retry logic are written once.

The accepted cost is one extra hop on client-side navigation, and that the kawi API is no longer exercised directly by a browser.

**Fifteen server function groups**, organised per resource operation rather than one per HTTP endpoint — several bundle related calls (e.g. `getMyOrders` covers list, detail, and cancel):

| Server function | Calls | Auth |
|---|---|---|
| `getBooks` | `GET /books` | public |
| `getBook` | `GET /books/:id` | public |
| `getAuthors` | `GET /authors` | public |
| `getAuthor` | `GET /authors/:id` + `GET /authors/:id/books` | public |
| `getBookReviews` | `GET /books/:bookId/reviews` | public |
| `authenticate` | `POST /auth/signup` \| `/login` | public |
| `signOut` | `POST /auth/logout` | session |
| `getCurrentUser` | `GET /users/me` | session |
| `submitOrder` | `POST /orders` | session |
| `getMyOrders` | `GET /orders`, `GET /orders/:id`, `PATCH /orders/:id/cancel` | session |
| `submitReview` | `POST /books/:bookId/reviews`, `PATCH`/`DELETE /reviews/:id` | session |
| `adminBooks` | book create/update/delete | role-checked |
| `adminAuthors` | author create/update/delete | role-checked |
| `adminOrders` | `GET /orders`, `PATCH /orders/:id/status` | admin |
| `adminUsers` | user list, role change, deactivate/reactivate | admin |

### Session and tokens

`useSession()` from TanStack Start provides an httpOnly, signed cookie session. It stores:

```ts
{ accessToken: string, refreshToken: string, user: { id, name, email, role } }
```

The session password must be ≥32 characters, supplied via environment, and `secure: true` in production.

**Token refresh.** The access token lives ~10 minutes; the refresh token 7 days. `api-client.ts` handles expiry reactively rather than on a timer: on a `401` from the kawi API it calls `POST /api/v1/auth/refresh` once with the stored refresh token, writes the rotated pair back to the session, and retries the original request. A second `401` clears the session and signals the caller to redirect to `/login`.

This must be **single-flight** — concurrent requests hitting a 401 together must share one refresh attempt. The backend implements reuse detection: presenting an already-rotated refresh token revokes the user's entire token family. Two parallel refreshes would log the user out.

### Role gating

Role is read from the session for **presentation** — which nav items render, which buttons appear.

⚠️ **In TanStack Start, server functions are the security boundary, not routes.** Every `createServerFn` is an RPC endpoint reachable by direct POST regardless of which route rendered the calling UI. Therefore:

- Every admin/publisher server function re-checks `session.user.role` before doing anything
- Route-level guards are a UX affordance only, never the enforcement point
- The backend's `authorize()` middleware remains the actual authority — the frontend must never be the only gate

**Publisher ownership.** `assertOwnership` in the backend permits `admin` to edit anything, but restricts `publisher` to rows where `createdBy` matches their user id. A publisher's book list therefore contains rows they cannot edit. This is handled per-row, not per-page: rows they don't own render without edit affordances and with an explanatory indicator. A `403` that slips through surfaces as a toast, not a crash.

## Route map

Two shells sharing one session.

**Storefront shell** (header + footer):

| Route | Access | `ssr` |
|---|---|---|
| `/` | public — featured books, search entry | `true` |
| `/books` | public — grid; `search`/`page`/`sortBy`/`orderBy` held in URL search params | `true` |
| `/books/$bookId` | public — detail, reviews, write-review form when eligible | `true` |
| `/authors`, `/authors/$authorId` | public — author and their books | `true` |
| `/cart` | public — localStorage cart, checkout requires auth | `false` |
| `/login`, `/signup`, `/forgot-password`, `/reset-password` | public | `true` |
| `/account` | authenticated — profile | `'data-only'` |
| `/account/orders`, `/account/orders/$orderId` | authenticated — history, cancel pending | `'data-only'` |

**Console shell** (sidebar):

| Route | Access | `ssr` |
|---|---|---|
| `/admin` | `admin` + `publisher` — overview | `'data-only'` |
| `/admin/books`, `/admin/books/new`, `/admin/books/$bookId` | `admin` + `publisher` (own rows only) | `'data-only'` |
| `/admin/authors`, `/admin/authors/new`, `/admin/authors/$authorId` | `admin` + `publisher` (own rows only) | `'data-only'` |
| `/admin/orders`, `/admin/orders/$orderId` | `admin` only — status transitions | `'data-only'` |
| `/admin/users` | `admin` only — roles, deactivate/reactivate | `'data-only'` |

URL-as-state for catalog filters is deliberate: it makes list views shareable, back-button correct, and directly serialisable to the API's `page`/`limit`/`sortBy`/`orderBy` params. TanStack Table's sorting and pagination model maps onto the same params in the console.

## Rendering strategy

Server functions and SSR are independent decisions, and conflating them leads to paying for rendering nobody benefits from.

- **Server functions** are required wherever a request needs a token. The browser cannot read the httpOnly session, so it cannot attach a `Bearer` header itself. This applies to every authenticated call regardless of rendering mode.
- **SSR** is only worth its cost where HTML-on-first-byte matters — public, indexable pages.

Start supports three per-route modes plus a function form. Children inherit and may only become *more* restrictive (`true → 'data-only' → false`, never the reverse), which fits one setting per shell.

| Mode | `beforeLoad` / `loader` | Component HTML |
|---|---|---|
| `true` | server | server |
| `'data-only'` | server | client |
| `false` | client | client |

Reasoning per group:

- **Public catalog — `ssr: true`.** These are the only pages a search engine will ever see, and first paint matters for a storefront.
- **Auth forms — `ssr: true`.** Two reasons. `beforeLoad` runs on the server, so a visitor who is *already* signed in gets redirected away from `/login` before any HTML ships — the mirror image of the guard on `/account`. And these are common entry points from bookmarks and email links, so the form should paint before JavaScript arrives rather than after. `/reset-password` reads its `token` from search params, which are available server-side.
- **`/cart` — `ssr: false`, and this one is not optional.** The cart lives in `localStorage`, a browser-only API. Server-rendering it would produce a guaranteed hydration mismatch, since the server cannot know the cart contents.
- **`/account/*` and `/admin/*` — `'data-only'`.** No SEO value, so component SSR is wasted — but `beforeLoad` still runs on the server, which is what makes a clean auth redirect possible. An unauthenticated visitor is redirected to `/login` *before any HTML ships*. With `ssr: false` the session check happens after hydration, giving a spinner and a visible flash before the redirect.

That last point is the real reason not to simply set `false` on everything behind auth: `'data-only'` buys server-side redirects and role checks without paying for component rendering.

The root `shellComponent` is always server-rendered regardless — the `<html>` wrapper cannot be client-only.

## Module boundaries

Mirrors the backend's one-job-per-file discipline.

```text
src/
  routes/                   file-based routes; loaders + UI composition only
  server/
    api-client.ts           ONLY place that knows the API base URL and error shape
    session.ts              ONLY place that reads/writes the session cookie
    books.server.ts         server functions per resource
    authors.server.ts
    auth.server.ts
    orders.server.ts
    reviews.server.ts
    users.server.ts
  features/
    books/ authors/ cart/ orders/ reviews/ admin/
                            components + hooks per domain; no direct fetch
  components/ui/            shadcn primitives
  schemas/                  Zod schemas shared between forms and server fn validators
  lib/                      formatters, cart reducer, utils
```

Rules, chosen to keep each unit independently understandable:

- **`api-client.ts` is the only module that knows the kawi API exists.** Base URL, Bearer header, error normalization, refresh-and-retry all live there. Nothing else calls `fetch` against the API.
- **`session.ts` is the only module that touches the session cookie.** Server functions ask it for tokens; they never construct cookie logic.
- **`features/**` never calls the kawi API directly.** Components read data from route loaders and perform mutations by importing server functions from `server/`. They never construct a URL, header, or query string for the backend — only typed arguments and typed results.
- **`schemas/` is shared.** The same Zod schema validates a TanStack Form on the client and the server function's `.validator()` on the server, mirroring the backend's DTO rules.

## API contract notes

The backend's conventions the frontend must handle:

- **Envelope:** every response is `{ status: "success" | "error", ... }`. Success bodies key the payload by resource name — `{ status, book }`, `{ status, pagination, books }` — not a generic `data` field.
- **Pagination:** requests take `page`, `limit` (max 100), `sortBy`, `orderBy`. Responses include `{ page, limit, total, totalPages }`.
- **Sort whitelists:** books `title|price|publishedDate|stock|createdAt`; orders `createdAt|total|status`; reviews `createdAt|rating`. Anything else is a 400 — so sort controls must offer only these.
- **Money is a string.** `price`, `total`, and `ratingsAverage` come back as decimal strings, not numbers. Never parse into a float for display or arithmetic on totals.
- **Book create takes `price` as a number** and the backend transforms it to a fixed-2 string. Asymmetric with reads.
- **`publishedDate` / `birthDate` are `YYYY-MM-DD`** date-only strings.
- **Order status machine:** `pending → paid → shipped`; `cancelled` is terminal and only reachable from `pending`. Only `pending` orders can be cancelled by their owner.
- **Reviews:** rating 1–5 integer, comment ≤1000 chars, one review per user per book (DB constraint), and only for books the user has a non-cancelled order for.

## Error handling

`api-client.ts` normalizes three distinct backend error shapes into one typed error:

```ts
class ApiClientError extends Error {
  status: number
  fieldErrors?: Record<string, string>   // from validation errors, keyed by path
}
```

| Source | Shape | Normalized to |
|---|---|---|
| `ApiError` | `{ status:"error", message }` | `message` |
| `validate` middleware | `{ status:"error", message, errors:[{path,message}] }` | `fieldErrors` keyed by `path` |
| Unknown route | `{ status:"error", message:"Cannot GET /x" }` | `message` |

Handling by status:

- **400 with `errors`** — mapped onto TanStack Form field errors by `path`, so backend validation surfaces inline on the right input
- **401** — single-flight refresh, retry once, then clear session and redirect to `/login`
- **403** — toast; for publisher ownership this is expected, not exceptional
- **409** — inline where the cause is knowable (duplicate review, email already registered)
- **5xx / network** — route `errorComponent` with a retry action

Every route defines an `errorComponent`; the root defines a `notFoundComponent`.

## Testing

- **Vitest unit** — `api-client` error normalization for all three shapes, the refresh single-flight guard, the cart reducer, money-string formatting
- **Vitest + MSW integration** — server functions against a mocked kawi API, including 401-then-refresh and 403 ownership paths
- **Playwright E2E** — against a locally running backend (`docker compose up`), never the deployed instance, to avoid polluting real data. Two core journeys: *signup → browse → cart → order → review*, and *admin creates author → creates book → advances order status*.

The backend's own 51 tests already cover API behaviour; frontend tests target the layers the backend cannot see — session handling, error mapping, cart logic, and role gating.

## Implementation order

This is a large surface for one pass, so it is built in milestones that each end somewhere usable. Every milestone after M1 depends only on the ones before it.

| # | Milestone | Ends with |
|---|---|---|
| M1 | Scaffold, Tailwind, shadcn, `api-client.ts`, `session.ts`, storefront shell | A styled shell that can call the API server-side |
| M2 | Public catalog — `/books`, `/books/$bookId`, `/authors`, `/authors/$authorId` | Browsable, searchable, SSR'd catalog with no auth |
| M3 | Auth — signup, login, logout, refresh single-flight, `/account` | A user can register and stay logged in across reloads |
| M4 | Cart + checkout — localStorage cart, `/cart`, `POST /orders`, `/account/orders` | A user can buy something and see the order |
| M5 | Reviews — review form gated on purchase, review list on book detail | The purchase-gated review path works end to end |
| M6 | Console shell + books/authors CRUD with per-row ownership | A publisher can manage their own catalog |
| M7 | Admin-only — orders with status transitions, users with roles | Full admin capability |

M2 is the natural first checkpoint: it exercises the entire data-access design — server functions, SSR loaders, URL-as-state, error handling — without auth in the way. If anything about the architecture is wrong, M2 reveals it cheaply.

M7 depends on the `GET /api/v1/users` endpoint below.

## Required backend changes

Two gaps block routes in the design:

1. **`GET /api/v1/users` does not exist.** `users.route.ts` exposes only `/me` and `/:id`. `/admin/users` cannot list users without a new admin-only, paginated list endpoint following the existing `getX` + `…Query` conventions. **Required.**
2. **Books have no cover image field.** `booksTable` has no image column, so the storefront grid can only render typographic cards. Adding `coverUrl varchar(500)` (nullable) plus DTO exposure is a small migration and materially changes how the catalog looks. **Recommended, not blocking** — v1 can ship typographic cards.

One unrelated fix worth making while in there:

3. **Refresh cookie path is wrong.** `COOKIES.refresh.path` is `/auth`, but the route is `/api/v1/auth/refresh`, so the browser would never send it. Currently masked by the `req.body.refreshToken` fallback. This design uses Bearer tokens and does not depend on it, but it is a real latent bug.

## Configuration

| Variable | Purpose |
|---|---|
| `KAWI_API_URL` | Base URL of the backend, server-side only |
| `SESSION_PASSWORD` | ≥32 chars, signs the session cookie |

`KAWI_API_URL` currently points at an ephemeral Fargate public IP that changes on every task replacement. Development will use `http://localhost:8000` against the local compose stack. A stable API hostname (the ALB + domain phase) is a prerequisite for a real frontend deployment, not for local work.

Because all API traffic is server-to-server, `KAWI_API_URL` is never exposed to the browser and CORS never applies.
