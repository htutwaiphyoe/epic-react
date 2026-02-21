# Kawi Frontend — Notes

Design rationale and hard-won details. The spec is in
`docs/superpowers/specs/`, the plan in `docs/superpowers/plans/`; this file is
for the *why*, and for the things that cost real time to work out.

## Conventions

Following kawi-backend: **no inline code comments**. Code should read on its
own, and reasoning belongs here rather than beside the lines it explains.
Imports use the **`@/`** alias, same as the backend, so a path reads
identically in both repos. The scaffold also offered `#/`; keeping two aliases
for one target just invites generated components and hand-written code to
drift apart, so `#/` was removed outright.

## Do not name server-function modules `*.server.ts`

This one broke client-side navigation in a way that took several passes to
pin down, and it is the single most important thing in this file.

TanStack Start treats the `.server.ts` filename suffix as **server-only: never
importable from the client**. When the client bundle imported
`src/server/books.server.ts`, Start's import protection replaced the whole
module with a mock:

```json
{"env":"client","importer":".../books.server.ts","specifier":".../books.server.ts","mode":"error"}
```

That is exactly backwards for a module exporting `createServerFn`. The client
*must* import it to get the RPC stub that calls the server. Instead the loader
received a mock function, returned it as data, and React complained
"Functions are not valid as a React child".

The symptoms pointed nowhere near the cause. Server rendering worked
perfectly — the bug only appeared after a client-side navigation, where
pagination rendered as `Page of · total` with every number missing and the
author page rendered nothing at all.

**So: server functions live in normally-named files** (`server/books.ts`).
The `.server.ts` suffix is for modules that must never reach the browser at
all.

## Why every API call goes through a server function

Tokens will live in an httpOnly session cookie, which JavaScript cannot read,
so the browser physically cannot attach an `Authorization` header. Any
authenticated call has to run on the server.

Routing *reads* through server functions as well, which is a separate
decision. A TanStack Router `loader` runs on the server for the first request
but in the browser for client-side navigations. Calling a server function
instead of the API directly means the request happens server-side either way.
Consequences: CORS never applies, the API URL never reaches the client, and
error handling lives in one place.

## SSR is a per-route decision

Server functions and SSR are independent, and conflating them means paying to
render pages nobody indexes.

- Public catalog and auth forms: `ssr: true`. The catalog is the only thing a
  crawler sees, and on auth pages `beforeLoad` running server-side lets an
  already-signed-in visitor be redirected before any HTML ships.
- `/account`, `/admin`: `ssr: 'data-only'` — no SEO value, but `beforeLoad`
  still runs on the server, which is what makes a clean auth redirect
  possible instead of a spinner and a flash.
- `/cart`: `ssr: false`, and not by choice — the cart lives in `localStorage`,
  so the server cannot know its contents and SSR would hydration-mismatch.

Inheritance only tightens: `true → 'data-only' → false`, never back.

## Money is a string

`price`, `total` and `ratingsAverage` arrive as decimal strings, because
Postgres `numeric` serialises that way. Parsing them into floats reintroduces
the rounding error the column type exists to prevent, so `lib/money.ts`
converts to integer cents and back. `0.10 × 3` must be `0.30`, not
`0.30000000000000004`.

One asymmetry to remember: reads return `price` as a string, but book *create*
accepts it as a number and the backend converts it.

`formatRating` returns a dash rather than `0.0` when a book has no ratings,
since the backend defaults `ratingsAverage` to `"0.00"`.

## Why axios, and the timeout that came with it

`fetch` would have been fine — it is native in Bun and this module is
server-only, so axios's historical value in smoothing over browser XHR quirks
never applied. axios was chosen deliberately, and it closed a real gap:
requests now time out after 10 seconds. Before that, a hung backend hung the
SSR render indefinitely, because these calls run inside route loaders.

`isAxiosError` splits the two failure modes cleanly. A response present means
normalise the backend's body; absent means the request never arrived, which is
reported as **status 0** — the same bucket for a connection failure and a
timeout.

## Server functions are the security boundary, not routes

Every `createServerFn` is a real RPC endpoint reachable by direct POST,
whatever route rendered the UI that calls it. Hiding an admin route protects
nothing. Role checks belong inside each server function — and the backend's
`authorize()` middleware stays the actual authority, because the frontend must
never be the only gate.

## Sort fields are a whitelist

The backend validates `sortBy` against a fixed list per resource and returns
400 for anything else.

- Books: `title`, `price`, `publishedDate`, `stock`, `createdAt`
- Authors: `name`, `email`, `birthDate`, `createdAt` — and authors take **no**
  `search` param, unlike books

`schemas/catalog.ts` is the single place those are written down, and
`SortSelect` is generic over the field union, so offering an unsupported sort
is a compile error rather than a 400 found at runtime.

## Environment

`.env` is gitignored, so the variables are documented here rather than in a
committed `.env.example`:

| Variable | Purpose |
|---|---|
| `KAWI_API_URL` | Base URL of the backend. Server-side only; never reaches the browser. `http://localhost:8000` locally. |
| `SESSION_PASSWORD` | Signs the session cookie. Must be ≥32 characters. Unused until auth lands, but validated from the start. |

**Bun loads `.env` into `process.env` by itself**, so no `dotenv` import is
needed — unlike the backend, which imports it explicitly.

`env.ts` exports `parseEnv` (pure, tested) and `getEnv()`, which re-reads
`process.env` on each call rather than memoising at import time. Parsing two
fields costs microseconds, and it keeps every consumer testable with
`vi.stubEnv`, which cannot work against a value captured at module load. The
trade-off is that validation fails on first use rather than at process boot.

## Verifying SSR — three traps

All three of these produced "the page is broken" evidence for pages that were
rendering perfectly.

1. **The dev-mode SSR response contains a null byte.** Plain `grep` therefore
   treats the page as binary and prints *nothing at all* — indistinguishable
   from zero matches. Always `grep -a`.
2. **React inserts `<!-- -->` between adjacent text nodes.** `{total} in the
   catalog` renders as `10<!-- --> in the catalog`, so a pattern like
   `[0-9]* in the catalog` matches with zero digits. Strip comments before
   matching.
3. **List routes 307-redirect** once `validateSearch` fills in defaults:
   `/books` → `/books?page=1&limit=20&orderBy=desc&sortBy=createdAt`. `curl`
   needs `-L`.

In Playwright, prefer web-first assertions (`await expect(locator).toHaveText`)
over reading `innerText()` once. Reading immediately after changing a select
races the re-render; the retrying assertion does not.

Also don't run `biome check --write` immediately before `test:e2e` against a
reused dev server. Formatting touches files, Vite hot-reloads mid-run, and
tests time out for reasons that have nothing to do with the code.

## Cart is client-side, for now

The API has no cart resource — `POST /api/v1/orders` takes the complete item
list in one call. The cart is therefore `localStorage` state that only becomes
server state at checkout. A real `carts` resource is planned, so the checkout
boundary should stay narrow enough to swap it in without touching components.

## Refresh is single-flight, keyed per refresh token

Server functions run in one long-lived process shared by every visitor, so a
module-level `refreshPromise` would be shared across users: B hitting a 401
while A's refresh is in flight would await A's promise and receive **A's
tokens**.

Keying by the presented refresh token gives the right granularity — two
concurrent requests from one browser share a token and therefore one refresh,
while different users never collide. `refresh-coordinator.ts` is deliberately
free of session and HTTP knowledge so this can be tested exhaustively.

It matters because the backend implements reuse detection: presenting an
already-rotated refresh token revokes the user's entire token family. Two
parallel refreshes would sign them out.

## Which layer knows what

- `api-client.ts` — transport only. Takes an optional access token, knows
  nothing about sessions.
- `authed.ts` — session-aware. Attaches the token, refreshes once on 401,
  retries, and clears the session if that still fails.
- `session.ts` — the only module that touches the cookie.

`requestApi` was left untouched when auth landed, which is why its tests still
hold. `/account` fetches its profile through `authedRequest` rather than
reading the cookie, so the stored access token is proven to work against the
backend rather than merely being stored.

## Logout is deliberately forgiving

`logoutFn` swallows a failing backend logout. If the refresh token is already
revoked or expired the API call fails, but the local session must still be
cleared — otherwise a user with a stale session can never sign out.

## The header costs a cookie read, not an API call

`loginFn` stores the user in the session, so `getSessionUserFn` decrypts the
cookie and returns. The root loader calls it on every navigation; that is not a
request to the backend.

## Run e2e against a production build, not the dev server

This cost several hours of chasing phantom failures. In dev, Vite compiles
client route chunks **on demand**, so the first client-side navigation to a
given route can take longer than any reasonable assertion timeout. Tests failed
at 15s, passed at 881ms once the route was warm, and which tests failed moved
around between runs.

Warming routes over HTTP does not fix it — that only compiles the SSR side, not
the client chunks a client-side navigation needs. A `globalSetup` that warms is
worse than useless, because Playwright runs `globalSetup` *before* it starts
`webServer`, so the fetches hit nothing and fail silently.

`playwright.config.ts` therefore builds and serves the production bundle on
port 4173. Nothing compiles on demand, the suite runs in ~6 seconds, and it
passes deterministically. The build takes about 200ms, so this costs nothing.

## The router devtools pollute accessibility locators

`getByLabel("Password")` resolved to three elements: the password input, plus
two devtools entries with `aria-label="Open match details for
/forgot-password"` and `.../reset-password`. `getByLabel` matches substrings,
and the devtools registers those entries only once the router has preloaded
those routes — so the failure was timing-dependent.

Two fixes, both worth having. `TanStackDevtools` is now gated behind
`import.meta.env.DEV`, which also stops it shipping in production builds where
it was previously unconditional. And auth locators use `{ exact: true }`.

The earlier stray `<h3>` that forced card selectors to be scoped to
`a[href^='/books/'] h3` was the same phenomenon.

## Biome rejects TanStack Form's documented children prop

`<form.Field children={(field) => …} />` is how the docs show it, but Biome's
`lint/correctness/noChildrenProp` rejects passing children as a prop. Use JSX
children instead — `<form.Field …>{(field) => …}</form.Field>` — which is
equivalent and lint-clean.

## The auth rate limiter constrains the e2e suite

`authLimiter` allows 10 requests per 15 minutes per IP on `/api/v1/auth`, and
the auth suite makes roughly six. Two runs inside one window start returning
429, which surfaces as an error banner and an unchanged URL rather than
anything mentioning rate limits. Restart the backend to clear the in-memory
counter: `docker restart kawi-backend-app-1`.
