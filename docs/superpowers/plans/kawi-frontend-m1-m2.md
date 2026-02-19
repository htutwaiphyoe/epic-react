# Kawi Frontend M1 + M2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a TanStack Start app with a server-side API access layer, then ship a fully server-rendered, searchable public book and author catalog.

**Architecture:** All calls to the kawi backend happen inside `createServerFn` handlers, so the browser never contacts the API and CORS never applies. A single module (`api-client.ts`) owns the base URL and error normalization. Catalog routes are `ssr: true` with list filters held in URL search params, which serialize directly to the API's `page`/`limit`/`sortBy`/`orderBy`.

**Tech Stack:** TanStack Start (pre-1.0, pinned), TanStack Router, TanStack Query v5, TypeScript, Zod v4, Tailwind CSS v4, shadcn/ui, Vitest, Playwright. **Bun** as package manager and script runner.

---

## Commit policy

⚠️ **Every commit in this plan is back-dated to a date the user supplies.** Do not run a bare `git commit`. Ask the user for the date, then run:

```bash
GIT_AUTHOR_DATE="<date the user gives>" \
GIT_COMMITTER_DATE="<date the user gives>" \
git commit -m "…"
```

Both variables are required — setting only `GIT_AUTHOR_DATE` leaves the committer date as "now", which is what GitHub's contribution graph reads. Commit messages follow Conventional Commits, matching the backend repo.

## Scope

**In:** M1 (scaffold, Tailwind/shadcn, `api-client`, env validation, money formatting, storefront shell) and M2 (public catalog — books list/detail, authors list/detail, home).

**Deliberately deferred, with reasons:**

- **`src/server/session.ts`** — the spec lists it under M1, but nothing in M1 or M2 reads a session; both milestones are entirely public. Building it now would mean untested, unused code. Moves to M3 alongside login.
- **Token refresh single-flight** — same reason. `api-client` takes an optional token from the start so M3 adds refresh without reshaping it.
- **Reviews** — the review list is a public read and could sit in M2, but keeping M2 to books and authors leaves one clear pattern to validate. Reviews (list + gated form) stay in M5 per the spec.
- **Runtime validation of API responses** — inputs are validated with Zod; responses are typed but not parsed. The backend is ours and has 51 tests. Revisit only if a shape mismatch actually bites.
- **TanStack Query v5** — in the spec's stack, but M2 has no client-side data needs: route loaders handle fetching, caching, and revalidation for every page here. Adding Query now would mean a second caching layer with nothing to cache. It earns its place in M3+ for mutations and optimistic updates. Install it then.
- **MSW** — the spec names it for server-function integration tests. M1/M2 tests stub `globalThis.fetch` directly, which is enough for a module with one dependency. MSW arrives with M3, where the auth flows need a stateful fake backend (401 → refresh → retry).

## File structure

| Path | Responsibility |
|---|---|
| `Note.md` | Learning notes and design rationale, mirroring the backend's |
| `.env` | Holds `KAWI_API_URL`, `SESSION_PASSWORD`; gitignored |
| `src/env.ts` | Validates server env at boot; fails loudly |
| `src/server/api-error.ts` | `ApiClientError` + normalization of the backend's three error shapes |
| `src/server/api-client.ts` | **Only** module that knows the API base URL; fetch + envelope unwrap |
| `src/server/types.ts` | TypeScript types mirroring backend resources |
| `src/server/books.server.ts` | `getBooksFn`, `getBookFn` server functions |
| `src/server/authors.server.ts` | `getAuthorsFn`, `getAuthorFn` server functions |
| `src/schemas/catalog.ts` | Zod schemas for list search params (shared by routes + server fns) |
| `src/lib/money.ts` | Formats decimal-string money without floats |
| `src/components/layout/Header.tsx` | Storefront header: brand, nav, search box |
| `src/components/layout/Footer.tsx` | Storefront footer |
| `src/features/books/BookCard.tsx` | Single book card |
| `src/features/books/BookGrid.tsx` | Grid of cards + empty state |
| `src/features/shared/Pagination.tsx` | Prev/next + page indicator driven by search params |
| `src/features/shared/SortSelect.tsx` | Sort control limited to backend-whitelisted fields |
| `src/routes/__root.tsx` | Shell, `ssr: true`, error + notFound components |
| `src/routes/index.tsx` | Home |
| `src/routes/books/index.tsx` | Books list |
| `src/routes/books/$bookId.tsx` | Book detail |
| `src/routes/authors/index.tsx` | Authors list |
| `src/routes/authors/$authorId.tsx` | Author detail + their books |
| `tests/*.test.ts` | Vitest unit tests |
| `e2e/catalog.spec.ts` | Playwright smoke test |

---

### Task 1: Scaffold the app

**Files:**
- Create: whole project tree via CLI

- [ ] **Step 1: Scaffold with the TanStack CLI**

```bash
cd /Users/htutwaiphyoe/Development/projects/kawi-frontend
bunx @tanstack/cli@latest create .
```

Choose: **React**, **TypeScript**, **Bun** as package manager, and enable **Tailwind** if offered. If the CLI refuses to write into a non-empty directory, scaffold to a temp dir and move the files in, preserving the existing `.git`, `README.md`, `.gitignore`, and `docs/`.

- [ ] **Step 2: Inspect what was generated**

```bash
ls -a && ls -R src | head -40 && cat package.json
```

Expected: `src/router.tsx`, `src/routes/__root.tsx`, `src/routes/index.tsx`, a `vite.config.ts`, and a `routeTree.gen.ts` (generated). Record any path that differs from the File structure table above and use the real paths for the rest of this plan.

- [ ] **Step 3: Pin every TanStack version**

Edit `package.json` and replace every `^`/`~` range on `@tanstack/*` with the exact installed version. Start is pre-1.0; ranges will break the build without warning.

```bash
bun pm ls | grep @tanstack
```

- [ ] **Step 4: Verify the dev server boots**

```bash
bun run dev
```

Expected: a local URL, and that URL renders the starter page. Stop the server.

- [ ] **Step 5: Commit** (see Commit policy)

```bash
git add -A
git commit -m "feat: scaffold TanStack Start app with Bun"
```

---

### Task 2: Vitest setup

**Files:**
- Modify: `package.json`, `vite.config.ts`
- Create: `tests/smoke.test.ts`

- [ ] **Step 1: Install Vitest**

```bash
bun add -d vitest
```

- [ ] **Step 2: Add the test script**

Add to `package.json` `scripts`:

```json
"test": "vitest run",
"test:watch": "vitest",
"typecheck": "tsc --noEmit"
```

- [ ] **Step 3: Write a failing placeholder test**

Create `tests/smoke.test.ts`:

```ts
import { describe, expect, it } from "vitest";

describe("test harness", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 4: Run it**

```bash
bun run test
```

Expected: PASS, 1 test.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "test: add vitest harness"
```

---

### Task 3: Server env validation

**Files:**
- Create: `src/env.ts`, `.env`, `tests/env.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/env.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseEnv } from "../src/env";

describe("parseEnv", () => {
  const valid = {
    KAWI_API_URL: "http://localhost:8000",
    SESSION_PASSWORD: "x".repeat(32),
  };

  it("accepts a valid environment", () => {
    expect(parseEnv(valid)).toEqual(valid);
  });

  it("rejects a missing API URL", () => {
    expect(() => parseEnv({ ...valid, KAWI_API_URL: undefined })).toThrow(
      /KAWI_API_URL/,
    );
  });

  it("rejects a non-URL API URL", () => {
    expect(() => parseEnv({ ...valid, KAWI_API_URL: "not-a-url" })).toThrow(
      /KAWI_API_URL/,
    );
  });

  it("rejects a session password under 32 characters", () => {
    expect(() => parseEnv({ ...valid, SESSION_PASSWORD: "short" })).toThrow(
      /SESSION_PASSWORD/,
    );
  });

  it("strips a trailing slash from the API URL", () => {
    expect(parseEnv({ ...valid, KAWI_API_URL: "http://localhost:8000/" }).KAWI_API_URL)
      .toBe("http://localhost:8000");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
bun run test tests/env.test.ts
```

Expected: FAIL — cannot resolve `../src/env`.

- [ ] **Step 3: Implement**

Create `src/env.ts`:

```ts
import { z } from "zod";

const envSchema = z.object({
  KAWI_API_URL: z
    .url("KAWI_API_URL must be a valid URL")
    .transform((value) => value.replace(/\/$/, "")),
  SESSION_PASSWORD: z
    .string()
    .min(32, "SESSION_PASSWORD must be at least 32 characters"),
});

export type Env = z.infer<typeof envSchema>;

export const parseEnv = (source: Record<string, string | undefined>): Env => {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    const detail = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("\n  - ");
    throw new Error(`Invalid environment variables:\n  - ${detail}`);
  }

  return result.data;
};

export const env = parseEnv(process.env);
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
bun run test tests/env.test.ts
```

Expected: PASS, 5 tests.

- [ ] **Step 5: Create `.env`**

```bash
# Base URL of the kawi-backend API. Server-side only — never exposed to the browser.
KAWI_API_URL=http://localhost:8000

# Signs the session cookie. Must be at least 32 characters. Used from M3 onward.
SESSION_PASSWORD=local-dev-session-password-32-chars-min
```

Confirm it will not be committed:

```bash
git check-ignore -v .env
```

Expected: a match. If not, add `.env` to `.gitignore` before continuing.

Because `.env` is gitignored, the variable list is documented in `Note.md` (Task 16) instead — otherwise a fresh clone has no record of what needs setting.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: validate server environment at boot"
```

---

### Task 4: Error normalization

The backend emits three distinct error shapes. This task turns all of them into one typed error.

**Files:**
- Create: `src/server/api-error.ts`, `tests/api-error.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/api-error.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { ApiClientError, normalizeApiError } from "../src/server/api-client";

describe("normalizeApiError", () => {
  it("normalizes an ApiError body", () => {
    const error = normalizeApiError(404, { status: "error", message: "Book is not found." });

    expect(error).toBeInstanceOf(ApiClientError);
    expect(error.status).toBe(404);
    expect(error.message).toBe("Book is not found.");
    expect(error.fieldErrors).toBeUndefined();
  });

  it("normalizes a validation body into fieldErrors keyed by path", () => {
    const error = normalizeApiError(400, {
      status: "error",
      message: "Invalid request data.",
      errors: [
        { path: "title", message: "Title is required" },
        { path: "price", message: "Price cannot be negative" },
      ],
    });

    expect(error.status).toBe(400);
    expect(error.fieldErrors).toEqual({
      title: "Title is required",
      price: "Price cannot be negative",
    });
  });

  it("keeps the first message when a path repeats", () => {
    const error = normalizeApiError(400, {
      status: "error",
      message: "Invalid request data.",
      errors: [
        { path: "rating", message: "Rating is required" },
        { path: "rating", message: "Rating must be between 1 and 5" },
      ],
    });

    expect(error.fieldErrors?.rating).toBe("Rating is required");
  });

  it("normalizes an unknown-route body", () => {
    const error = normalizeApiError(404, {
      status: "error",
      message: "Cannot GET /api/v1/nope",
    });

    expect(error.message).toBe("Cannot GET /api/v1/nope");
  });

  it("falls back to a generic message when the body is not JSON-shaped", () => {
    const error = normalizeApiError(502, "<html>Bad Gateway</html>");

    expect(error.status).toBe(502);
    expect(error.message).toBe("Request failed with status 502.");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
bun run test tests/api-error.test.ts
```

Expected: FAIL — cannot resolve `../src/server/api-client`.

- [ ] **Step 3: Implement**

Create `src/server/api-error.ts`:

```ts
export class ApiClientError extends Error {
  readonly status: number;
  readonly fieldErrors?: Record<string, string>;

  constructor(
    status: number,
    message: string,
    fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

type ValidationIssue = { path: string; message: string };

type ErrorBody = {
  status?: string;
  message?: string;
  errors?: ValidationIssue[];
};

const isErrorBody = (body: unknown): body is ErrorBody =>
  typeof body === "object" && body !== null;

export const normalizeApiError = (
  status: number,
  body: unknown,
): ApiClientError => {
  if (!isErrorBody(body) || typeof body.message !== "string") {
    return new ApiClientError(status, `Request failed with status ${status}.`);
  }

  if (Array.isArray(body.errors) && body.errors.length > 0) {
    const fieldErrors: Record<string, string> = {};

    for (const issue of body.errors) {
      if (!(issue.path in fieldErrors)) {
        fieldErrors[issue.path] = issue.message;
      }
    }

    return new ApiClientError(status, body.message, fieldErrors);
  }

  return new ApiClientError(status, body.message);
};
```

- [ ] **Step 4: Re-export from `api-client.ts` so the test import resolves**

Create `src/server/api-client.ts` with only the re-export for now:

```ts
export { ApiClientError, normalizeApiError } from "./api-error";
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
bun run test tests/api-error.test.ts
```

Expected: PASS, 5 tests.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: normalize backend error shapes into ApiClientError"
```

---

### Task 5: API client

**Files:**
- Modify: `src/server/api-client.ts`
- Create: `tests/api-client.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/api-client.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClientError, requestApi } from "../src/server/api-client";

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

describe("requestApi", () => {
  beforeEach(() => {
    vi.stubEnv("KAWI_API_URL", "http://api.test");
    vi.stubEnv("SESSION_PASSWORD", "x".repeat(32));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("prefixes the API base URL and the /api/v1 namespace", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse(200, { status: "success", books: [] }));

    await requestApi("/books");

    expect(fetchMock.mock.calls[0][0]).toBe("http://api.test/api/v1/books");
  });

  it("serializes query params and omits undefined values", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse(200, { status: "success", books: [] }));

    await requestApi("/books", { query: { page: 2, search: undefined, limit: 20 } });

    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://api.test/api/v1/books?page=2&limit=20",
    );
  });

  it("attaches a bearer token when given one", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse(200, { status: "success" }));

    await requestApi("/users/me", { accessToken: "tok123" });

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(new Headers(init.headers).get("authorization")).toBe("Bearer tok123");
  });

  it("sends no authorization header without a token", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse(200, { status: "success" }));

    await requestApi("/books");

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(new Headers(init.headers).has("authorization")).toBe(false);
  });

  it("returns the parsed body on success", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse(200, { status: "success", book: { id: "b1", title: "Zurich 1953" } }),
    );

    const body = await requestApi<{ book: { id: string; title: string } }>("/books/b1");

    expect(body.book.title).toBe("Zurich 1953");
  });

  it("throws a normalized ApiClientError on an error status", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse(404, { status: "error", message: "Book is not found." }),
    );

    await expect(requestApi("/books/missing")).rejects.toMatchObject({
      status: 404,
      message: "Book is not found.",
    });
  });

  it("throws ApiClientError with status 0 when the network fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("fetch failed"));

    const error = await requestApi("/books").catch((e) => e);

    expect(error).toBeInstanceOf(ApiClientError);
    expect(error.status).toBe(0);
  });

  it("sends a JSON body and content-type for POST", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse(201, { status: "success" }));

    await requestApi("/orders", { method: "POST", body: { items: [] } });

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ items: [] }));
    expect(new Headers(init.headers).get("content-type")).toBe("application/json");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
bun run test tests/api-client.test.ts
```

Expected: FAIL — `requestApi` is not exported.

- [ ] **Step 3: Implement**

Replace `src/server/api-client.ts` with:

```ts
import { env } from "../env";
import { ApiClientError, normalizeApiError } from "./api-error";

export { ApiClientError, normalizeApiError };

type QueryValue = string | number | boolean | undefined;

export type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  query?: Record<string, QueryValue>;
  body?: unknown;
  accessToken?: string;
};

const buildUrl = (path: string, query?: Record<string, QueryValue>): string => {
  const url = new URL(`${env.KAWI_API_URL}/api/v1${path}`);

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
};

export const requestApi = async <T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> => {
  const headers = new Headers();

  if (options.accessToken) {
    headers.set("authorization", `Bearer ${options.accessToken}`);
  }

  if (options.body !== undefined) {
    headers.set("content-type", "application/json");
  }

  let response: Response;

  try {
    response = await fetch(buildUrl(path, options.query), {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch (cause) {
    throw new ApiClientError(0, "Could not reach the Kawi API.", undefined);
  }

  const raw = await response.text();
  const parsed = raw.length > 0 ? safeJsonParse(raw) : undefined;

  if (!response.ok) {
    throw normalizeApiError(response.status, parsed ?? raw);
  }

  return parsed as T;
};

const safeJsonParse = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
};
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
bun run test tests/api-client.test.ts
```

Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add server-side kawi API client"
```

---

### Task 6: Money formatting

The backend returns `price`, `total`, and `ratingsAverage` as decimal **strings**. Parsing them into floats loses precision on totals, so formatting stays string-based.

**Files:**
- Create: `src/lib/money.ts`, `tests/money.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/money.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { formatMoney, formatRating, multiplyMoney, sumMoney } from "../src/lib/money";

describe("formatMoney", () => {
  it("formats a decimal string as USD", () => {
    expect(formatMoney("29.99")).toBe("$29.99");
  });

  it("pads a whole-number string to two decimals", () => {
    expect(formatMoney("18")).toBe("$18.00");
  });

  it("groups thousands", () => {
    expect(formatMoney("1234.50")).toBe("$1,234.50");
  });
});

describe("multiplyMoney", () => {
  it("multiplies a price string by a quantity without float drift", () => {
    expect(multiplyMoney("0.10", 3)).toBe("0.30");
  });

  it("handles a larger price", () => {
    expect(multiplyMoney("29.99", 2)).toBe("59.98");
  });
});

describe("sumMoney", () => {
  it("sums decimal strings exactly", () => {
    expect(sumMoney(["0.10", "0.20"])).toBe("0.30");
  });

  it("returns zero for an empty list", () => {
    expect(sumMoney([])).toBe("0.00");
  });
});

describe("formatRating", () => {
  it("shows one decimal place", () => {
    expect(formatRating("4.50")).toBe("4.5");
  });

  it("returns a dash when there are no ratings", () => {
    expect(formatRating("0.00", 0)).toBe("—");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
bun run test tests/money.test.ts
```

Expected: FAIL — cannot resolve `../src/lib/money`.

- [ ] **Step 3: Implement**

Create `src/lib/money.ts`. Arithmetic goes through integer cents so `0.10 * 3` cannot become `0.30000000000000004`:

```ts
const toCents = (amount: string): number => {
  const [whole, fraction = ""] = amount.split(".");
  const paddedFraction = fraction.padEnd(2, "0").slice(0, 2);
  return Number(whole) * 100 + Number(paddedFraction);
};

const fromCents = (cents: number): string =>
  `${Math.trunc(cents / 100)}.${String(Math.abs(cents) % 100).padStart(2, "0")}`;

export const formatMoney = (amount: string, currency = "USD"): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(toCents(amount) / 100);

export const multiplyMoney = (amount: string, quantity: number): string =>
  fromCents(toCents(amount) * quantity);

export const sumMoney = (amounts: string[]): string =>
  fromCents(amounts.reduce((total, amount) => total + toCents(amount), 0));

export const formatRating = (average: string, count?: number): string =>
  count === 0 ? "—" : (toCents(average) / 100).toFixed(1);
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
bun run test tests/money.test.ts
```

Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: format decimal-string money without float arithmetic"
```

---

### Task 7: Tailwind v4 and shadcn/ui

**Files:**
- Modify: `vite.config.ts`, `src/styles.css` (or the scaffold's CSS entry)
- Create: `components.json`

- [ ] **Step 1: Install Tailwind v4**

Skip if the scaffold already added it — verify with `bun pm ls | grep tailwind` first.

```bash
bun add tailwindcss @tailwindcss/vite
```

- [ ] **Step 2: Register the Vite plugin**

Add to `vite.config.ts` plugins, before the TanStack Start plugin:

```ts
import tailwindcss from "@tailwindcss/vite";
// plugins: [tailwindcss(), ...existing]
```

- [ ] **Step 3: Import Tailwind in the CSS entry**

Ensure the CSS entry file contains:

```css
@import "tailwindcss";
```

- [ ] **Step 4: Initialize shadcn/ui**

```bash
bunx shadcn@latest init
```

Then add the primitives this plan needs:

```bash
bunx shadcn@latest add button card input select skeleton badge
```

- [ ] **Step 5: Verify a Tailwind class renders**

Temporarily add `className="text-3xl font-bold text-red-500"` to the heading in `src/routes/index.tsx`, run `bun run dev`, confirm it renders red and large, then revert the change.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add Tailwind v4 and shadcn/ui"
```

---

### Task 8: Storefront shell

**Files:**
- Modify: `src/routes/__root.tsx`
- Create: `src/components/layout/Header.tsx`, `src/components/layout/Footer.tsx`

- [ ] **Step 1: Create the header**

Create `src/components/layout/Header.tsx`:

```tsx
import { Link } from "@tanstack/react-router";

export const Header = () => (
  <header className="border-b">
    <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-4">
      <Link to="/" className="text-lg font-semibold tracking-tight">
        Kawi
      </Link>

      <nav className="flex gap-4 text-sm">
        <Link to="/books" className="hover:underline" activeProps={{ className: "underline" }}>
          Books
        </Link>
        <Link to="/authors" className="hover:underline" activeProps={{ className: "underline" }}>
          Authors
        </Link>
      </nav>
    </div>
  </header>
);
```

- [ ] **Step 2: Create the footer**

Create `src/components/layout/Footer.tsx`:

```tsx
export const Footer = () => (
  <footer className="mt-16 border-t">
    <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-muted-foreground">
      Kawi — a catalog of chess books.
    </div>
  </footer>
);
```

- [ ] **Step 3: Wire them into the root route with error and notFound components**

Edit `src/routes/__root.tsx`. Keep whatever `shellComponent`/`head` the scaffold generated and add:

```tsx
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";

export const Route = createRootRoute({
  ssr: true,
  component: RootLayout,
  errorComponent: ({ error }) => (
    <Shell>
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-muted-foreground">{error.message}</p>
    </Shell>
  ),
  notFoundComponent: () => (
    <Shell>
      <h1 className="text-2xl font-semibold">Page not found</h1>
    </Shell>
  ),
});

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
      <Footer />
    </div>
  );
}

function RootLayout() {
  return (
    <Shell>
      <Outlet />
    </Shell>
  );
}
```

- [ ] **Step 4: Verify**

```bash
bun run dev
```

Expected: header with Kawi / Books / Authors, footer at the bottom. Visit a nonsense path like `/zzz` and confirm the notFound component renders inside the shell.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add storefront shell with header, footer, and error boundaries"
```

---

### Task 9: Resource types and catalog search schemas

**Files:**
- Create: `src/server/types.ts`, `src/schemas/catalog.ts`, `tests/catalog-schema.test.ts`

- [ ] **Step 1: Create the resource types**

These mirror the backend's Drizzle models exactly. Note every money field is a `string`.

Create `src/server/types.ts`:

```ts
export type Book = {
  id: string;
  title: string;
  authorId: string;
  isbn: string | null;
  description: string | null;
  price: string;
  publishedDate: string;
  stock: number;
  ratingsAverage: string;
  ratingsCount: number;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type Author = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  bio: string | null;
  nationality: string | null;
  birthDate: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type BookWithAuthor = Book & { author: Author | null };

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type BooksResponse = { status: "success"; pagination: Pagination; books: Book[] };
export type BookResponse = { status: "success"; book: BookWithAuthor };
export type AuthorsResponse = { status: "success"; pagination: Pagination; authors: Author[] };
export type AuthorResponse = { status: "success"; author: Author };
```

- [ ] **Step 2: Write the failing schema test**

The sort whitelists must match the backend exactly, or the API returns 400.

Create `tests/catalog-schema.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { authorsSearchSchema, booksSearchSchema } from "../src/schemas/catalog";

describe("booksSearchSchema", () => {
  it("applies defaults for an empty query", () => {
    expect(booksSearchSchema.parse({})).toEqual({
      page: 1,
      limit: 20,
      sortBy: "createdAt",
      orderBy: "desc",
    });
  });

  it("coerces numeric strings from the URL", () => {
    const parsed = booksSearchSchema.parse({ page: "3", limit: "10" });
    expect(parsed.page).toBe(3);
    expect(parsed.limit).toBe(10);
  });

  it("keeps a search term", () => {
    expect(booksSearchSchema.parse({ search: "chess" }).search).toBe("chess");
  });

  it("rejects a sort field the backend does not allow", () => {
    expect(() => booksSearchSchema.parse({ sortBy: "isbn" })).toThrow();
  });

  it("accepts every sort field the backend allows", () => {
    for (const sortBy of ["title", "price", "publishedDate", "stock", "createdAt"]) {
      expect(booksSearchSchema.parse({ sortBy }).sortBy).toBe(sortBy);
    }
  });

  it("rejects a limit above the backend maximum of 100", () => {
    expect(() => booksSearchSchema.parse({ limit: 101 })).toThrow();
  });

  it("rejects a page below 1", () => {
    expect(() => booksSearchSchema.parse({ page: 0 })).toThrow();
  });
});

describe("authorsSearchSchema", () => {
  it("defaults to sorting by createdAt descending", () => {
    expect(authorsSearchSchema.parse({})).toEqual({
      page: 1,
      limit: 20,
      sortBy: "createdAt",
      orderBy: "desc",
    });
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

```bash
bun run test tests/catalog-schema.test.ts
```

Expected: FAIL — cannot resolve `../src/schemas/catalog`.

- [ ] **Step 4: Implement**

Create `src/schemas/catalog.ts`:

```ts
import { z } from "zod";

const paginationFields = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  orderBy: z.enum(["asc", "desc"]).default("desc"),
};

export const booksSearchSchema = z.object({
  ...paginationFields,
  search: z.string().trim().min(1).optional(),
  sortBy: z
    .enum(["title", "price", "publishedDate", "stock", "createdAt"])
    .default("createdAt"),
});

export type BooksSearch = z.infer<typeof booksSearchSchema>;

export const authorsSearchSchema = z.object({
  ...paginationFields,
  sortBy: z.enum(["name", "email", "birthDate", "createdAt"]).default("createdAt"),
});

export type AuthorsSearch = z.infer<typeof authorsSearchSchema>;
```

Both whitelists are copied verbatim from the backend DTOs (`books.dto.ts` and `authors.dto.ts`) — the backend returns 400 for anything outside them. Note authors has **no** `search` param, unlike books.

- [ ] **Step 5: Run tests to verify they pass**

```bash
bun run test tests/catalog-schema.test.ts
```

Expected: PASS, 8 tests.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add catalog resource types and search param schemas"
```

---

### Task 10: Book server functions

**Files:**
- Create: `src/server/books.server.ts`

- [ ] **Step 1: Implement the server functions**

Create `src/server/books.server.ts`:

```ts
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { booksSearchSchema } from "../schemas/catalog";
import { requestApi } from "./api-client";
import type { BookResponse, BooksResponse } from "./types";

export const getBooksFn = createServerFn({ method: "GET" })
  .validator(booksSearchSchema)
  .handler(async ({ data }) => {
    const body = await requestApi<BooksResponse>("/books", { query: data });
    return { books: body.books, pagination: body.pagination };
  });

export const getBookFn = createServerFn({ method: "GET" })
  .validator(z.object({ bookId: z.uuid() }))
  .handler(async ({ data }) => {
    const body = await requestApi<BookResponse>(`/books/${data.bookId}`);
    return body.book;
  });

export const getBooksByAuthorFn = createServerFn({ method: "GET" })
  .validator(booksSearchSchema.extend({ authorId: z.uuid() }))
  .handler(async ({ data }) => {
    const { authorId, ...query } = data;
    const body = await requestApi<BooksResponse>(`/authors/${authorId}/books`, { query });
    return { books: body.books, pagination: body.pagination };
  });
```

- [ ] **Step 2: Typecheck**

```bash
bun run typecheck
```

Expected: no errors. If `createServerFn`'s validator rejects a Zod schema directly in your pinned version, wrap it: `.validator((input: unknown) => booksSearchSchema.parse(input))`.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add book catalog server functions"
```

---

### Task 11: Books list route

**Files:**
- Create: `src/routes/books/index.tsx`, `src/features/books/BookCard.tsx`, `src/features/books/BookGrid.tsx`, `src/features/shared/Pagination.tsx`, `src/features/shared/SortSelect.tsx`

- [ ] **Step 1: Create the book card**

Create `src/features/books/BookCard.tsx`:

```tsx
import { Link } from "@tanstack/react-router";
import { formatMoney, formatRating } from "../../lib/money";
import type { Book } from "../../server/types";

export const BookCard = ({ book }: { book: Book }) => (
  <Link
    to="/books/$bookId"
    params={{ bookId: book.id }}
    className="flex flex-col rounded-lg border p-4 transition hover:shadow-md"
  >
    <h3 className="font-medium leading-snug">{book.title}</h3>

    <div className="mt-auto pt-4 text-sm text-muted-foreground">
      <div className="font-semibold text-foreground">{formatMoney(book.price)}</div>
      <div>
        {formatRating(book.ratingsAverage, book.ratingsCount)}
        {book.ratingsCount > 0 ? ` · ${book.ratingsCount} reviews` : ""}
      </div>
      {book.stock === 0 ? <div className="text-destructive">Out of stock</div> : null}
    </div>
  </Link>
);
```

- [ ] **Step 2: Create the grid with an empty state**

Create `src/features/books/BookGrid.tsx`:

```tsx
import type { Book } from "../../server/types";
import { BookCard } from "./BookCard";

export const BookGrid = ({ books }: { books: Book[] }) => {
  if (books.length === 0) {
    return (
      <p className="py-16 text-center text-muted-foreground">
        No books matched your search.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
};
```

- [ ] **Step 3: Create the pagination control**

Create `src/features/shared/Pagination.tsx`:

```tsx
import { Link } from "@tanstack/react-router";
import type { Pagination as PaginationData } from "../../server/types";

type Props = { pagination: PaginationData; to: string };

export const Pagination = ({ pagination, to }: Props) => {
  const { page, totalPages } = pagination;

  if (totalPages <= 1) return null;

  return (
    <nav className="mt-8 flex items-center justify-center gap-4 text-sm">
      {page > 1 ? (
        <Link to={to} search={(prev) => ({ ...prev, page: page - 1 })} className="hover:underline">
          ‹ Previous
        </Link>
      ) : (
        <span className="text-muted-foreground">‹ Previous</span>
      )}

      <span className="text-muted-foreground">
        Page {page} of {totalPages} · {pagination.total} total
      </span>

      {page < totalPages ? (
        <Link to={to} search={(prev) => ({ ...prev, page: page + 1 })} className="hover:underline">
          Next ›
        </Link>
      ) : (
        <span className="text-muted-foreground">Next ›</span>
      )}
    </nav>
  );
};
```

- [ ] **Step 4: Create the sort control**

Create `src/features/shared/SortSelect.tsx`. The options are exactly the backend's whitelist:

```tsx
import { useNavigate } from "@tanstack/react-router";

const OPTIONS = [
  { value: "createdAt", label: "Newest" },
  { value: "title", label: "Title" },
  { value: "price", label: "Price" },
  { value: "publishedDate", label: "Published" },
  { value: "stock", label: "Stock" },
] as const;

export const SortSelect = ({ sortBy, orderBy }: { sortBy: string; orderBy: string }) => {
  const navigate = useNavigate();

  return (
    <div className="flex gap-2 text-sm">
      <select
        value={sortBy}
        onChange={(event) =>
          navigate({ search: (prev) => ({ ...prev, sortBy: event.target.value, page: 1 }) })
        }
        className="rounded border px-2 py-1"
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <select
        value={orderBy}
        onChange={(event) =>
          navigate({ search: (prev) => ({ ...prev, orderBy: event.target.value, page: 1 }) })
        }
        className="rounded border px-2 py-1"
      >
        <option value="desc">Descending</option>
        <option value="asc">Ascending</option>
      </select>
    </div>
  );
};
```

- [ ] **Step 5: Create the route**

Create `src/routes/books/index.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { BookGrid } from "../../features/books/BookGrid";
import { Pagination } from "../../features/shared/Pagination";
import { SortSelect } from "../../features/shared/SortSelect";
import { booksSearchSchema } from "../../schemas/catalog";
import { getBooksFn } from "../../server/books.server";

export const Route = createFileRoute("/books/")({
  ssr: true,
  validateSearch: booksSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getBooksFn({ data: deps }),
  component: BooksPage,
});

function BooksPage() {
  const { books, pagination } = Route.useLoaderData();
  const search = Route.useSearch();

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Books</h1>
        <SortSelect sortBy={search.sortBy} orderBy={search.orderBy} />
      </div>

      <BookGrid books={books} />
      <Pagination pagination={pagination} to="/books" />
    </>
  );
}
```

- [ ] **Step 6: Verify against the real API**

Start the backend, then the frontend:

```bash
# terminal 1, in kawi-backend
docker compose up -d postgres redis && bun run dev
# terminal 2, in kawi-frontend
bun run dev
```

Visit `/books`. Then confirm SSR is real:

```bash
curl -s http://localhost:3000/books | grep -ac "rounded-lg border p-4"
```

Expected: a non-zero count — the cards are in the server-rendered HTML, not injected by JS. Also click through pagination and change sort, confirming the URL updates and results change.

⚠️ **The `-a` flag is required.** In dev mode the SSR response contains a null byte, so plain `grep` treats the page as binary and prints nothing at all — indistinguishable from "no matches" on a page that is actually working.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add server-rendered books list with search params"
```

---

### Task 12: Book detail route

**Files:**
- Create: `src/routes/books/$bookId.tsx`

- [ ] **Step 1: Create the route**

Create `src/routes/books/$bookId.tsx`:

```tsx
import { Link, createFileRoute } from "@tanstack/react-router";
import { formatMoney, formatRating } from "../../lib/money";
import { getBookFn } from "../../server/books.server";

export const Route = createFileRoute("/books/$bookId")({
  ssr: true,
  loader: ({ params }) => getBookFn({ data: { bookId: params.bookId } }),
  component: BookDetailPage,
});

function BookDetailPage() {
  const book = Route.useLoaderData();

  return (
    <article className="max-w-2xl">
      <h1 className="text-3xl font-semibold leading-tight">{book.title}</h1>

      {book.author ? (
        <Link
          to="/authors/$authorId"
          params={{ authorId: book.author.id }}
          className="mt-2 inline-block text-muted-foreground hover:underline"
        >
          {book.author.name}
        </Link>
      ) : null}

      <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-muted-foreground">Price</dt>
          <dd className="text-lg font-semibold">{formatMoney(book.price)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Rating</dt>
          <dd className="text-lg font-semibold">
            {formatRating(book.ratingsAverage, book.ratingsCount)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Stock</dt>
          <dd className="text-lg font-semibold">{book.stock}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Published</dt>
          <dd className="text-lg font-semibold">{book.publishedDate}</dd>
        </div>
      </dl>

      {book.description ? (
        <p className="mt-6 leading-relaxed">{book.description}</p>
      ) : null}

      {book.isbn ? (
        <p className="mt-6 text-sm text-muted-foreground">ISBN {book.isbn}</p>
      ) : null}
    </article>
  );
}
```

- [ ] **Step 2: Verify, including the not-found path**

With both servers running, click a book from `/books`. Then request a valid-shaped but nonexistent id:

```bash
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/books/00000000-0000-0000-0000-000000000000"
```

Expected: the page renders the root `errorComponent` with "Book is not found." rather than crashing — this is `ApiClientError` from Task 4 surfacing through the loader.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add book detail route"
```

---

### Task 13: Author routes

**Files:**
- Create: `src/server/authors.server.ts`, `src/routes/authors/index.tsx`, `src/routes/authors/$authorId.tsx`

- [ ] **Step 1: Create the author server functions**

Create `src/server/authors.server.ts`:

```ts
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authorsSearchSchema } from "../schemas/catalog";
import { requestApi } from "./api-client";
import type { AuthorResponse, AuthorsResponse } from "./types";

export const getAuthorsFn = createServerFn({ method: "GET" })
  .validator(authorsSearchSchema)
  .handler(async ({ data }) => {
    const body = await requestApi<AuthorsResponse>("/authors", { query: data });
    return { authors: body.authors, pagination: body.pagination };
  });

export const getAuthorFn = createServerFn({ method: "GET" })
  .validator(z.object({ authorId: z.uuid() }))
  .handler(async ({ data }) => {
    const body = await requestApi<AuthorResponse>(`/authors/${data.authorId}`);
    return body.author;
  });
```

- [ ] **Step 2: Create the authors list route**

Create `src/routes/authors/index.tsx`:

```tsx
import { Link, createFileRoute } from "@tanstack/react-router";
import { Pagination } from "../../features/shared/Pagination";
import { authorsSearchSchema } from "../../schemas/catalog";
import { getAuthorsFn } from "../../server/authors.server";

export const Route = createFileRoute("/authors/")({
  ssr: true,
  validateSearch: authorsSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getAuthorsFn({ data: deps }),
  component: AuthorsPage,
});

function AuthorsPage() {
  const { authors, pagination } = Route.useLoaderData();

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Authors</h1>

      {authors.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">No authors yet.</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {authors.map((author) => (
            <li key={author.id}>
              <Link
                to="/authors/$authorId"
                params={{ authorId: author.id }}
                className="flex items-baseline justify-between p-4 hover:bg-muted"
              >
                <span className="font-medium">{author.name}</span>
                {author.nationality ? (
                  <span className="text-sm text-muted-foreground">{author.nationality}</span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Pagination pagination={pagination} to="/authors" />
    </>
  );
}
```

- [ ] **Step 3: Create the author detail route with their books**

Two loader calls run in parallel — the author record and their books.

Create `src/routes/authors/$authorId.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { BookGrid } from "../../features/books/BookGrid";
import { Pagination } from "../../features/shared/Pagination";
import { booksSearchSchema } from "../../schemas/catalog";
import { getAuthorFn } from "../../server/authors.server";
import { getBooksByAuthorFn } from "../../server/books.server";

export const Route = createFileRoute("/authors/$authorId")({
  ssr: true,
  validateSearch: booksSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ params, deps }) => {
    const [author, books] = await Promise.all([
      getAuthorFn({ data: { authorId: params.authorId } }),
      getBooksByAuthorFn({ data: { ...deps, authorId: params.authorId } }),
    ]);

    return { author, ...books };
  },
  component: AuthorDetailPage,
});

function AuthorDetailPage() {
  const { author, books, pagination } = Route.useLoaderData();

  return (
    <>
      <header className="mb-8">
        <h1 className="text-3xl font-semibold">{author.name}</h1>
        {author.nationality ? (
          <p className="mt-1 text-muted-foreground">{author.nationality}</p>
        ) : null}
        {author.bio ? <p className="mt-4 max-w-2xl leading-relaxed">{author.bio}</p> : null}
      </header>

      <h2 className="mb-4 text-xl font-semibold">Books</h2>
      <BookGrid books={books} />
      <Pagination pagination={pagination} to="/authors/$authorId" />
    </>
  );
}
```

- [ ] **Step 4: Verify**

With both servers running, visit `/authors`, click through to an author, and confirm their books render. Confirm the author's books come from `GET /authors/:id/books` by watching the backend log output.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add author list and detail routes"
```

---

### Task 14: Home page

**Files:**
- Modify: `src/routes/index.tsx`

- [ ] **Step 1: Replace the scaffold home page**

Shows the six newest books, reusing the same server function.

```tsx
import { Link, createFileRoute } from "@tanstack/react-router";
import { BookGrid } from "../features/books/BookGrid";
import { getBooksFn } from "../server/books.server";

export const Route = createFileRoute("/")({
  ssr: true,
  loader: () =>
    getBooksFn({
      data: { page: 1, limit: 6, sortBy: "createdAt", orderBy: "desc" },
    }),
  component: HomePage,
});

function HomePage() {
  const { books } = Route.useLoaderData();

  return (
    <>
      <section className="mb-12 max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight">Chess books, catalogued.</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Browse the collection by title, price, or publication date.
        </p>
        <Link
          to="/books"
          className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-primary-foreground"
        >
          Browse all books
        </Link>
      </section>

      <h2 className="mb-4 text-xl font-semibold">Recently added</h2>
      <BookGrid books={books} />
    </>
  );
}
```

- [ ] **Step 2: Verify**

Visit `/` and confirm six books render and the CTA navigates to `/books`.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add home page with recently added books"
```

---

### Task 15: Playwright smoke test

**Files:**
- Create: `playwright.config.ts`, `e2e/catalog.spec.ts`
- Modify: `package.json`

- [ ] **Step 1: Install Playwright**

```bash
bun add -d @playwright/test
bunx playwright install chromium
```

- [ ] **Step 2: Create the config**

Create `playwright.config.ts`:

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: "http://localhost:3000" },
  webServer: {
    command: "bun run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
```

- [ ] **Step 3: Write the smoke test**

Create `e2e/catalog.spec.ts`. Requires the backend running locally with at least one book.

```ts
import { expect, test } from "@playwright/test";

test("browses from home to a book detail page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Chess books, catalogued." })).toBeVisible();

  await page.getByRole("link", { name: "Browse all books" }).click();
  await expect(page).toHaveURL(/\/books/);
  await expect(page.getByRole("heading", { name: "Books", level: 1 })).toBeVisible();

  const firstBook = page.locator("a[href^='/books/']").first();
  const title = await firstBook.locator("h3").innerText();
  await firstBook.click();

  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
});

test("sorting updates the URL and reloads results", async ({ page }) => {
  await page.goto("/books");
  await page.locator("select").first().selectOption("title");
  await expect(page).toHaveURL(/sortBy=title/);
});

test("an unknown book id renders the error boundary, not a crash", async ({ page }) => {
  await page.goto("/books/00000000-0000-0000-0000-000000000000");
  await expect(page.getByText("Book is not found.")).toBeVisible();
});
```

- [ ] **Step 4: Add the script and run it**

Add to `package.json` scripts: `"test:e2e": "playwright test"`, then:

```bash
bun run test:e2e
```

Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "test: add catalog smoke tests"
```

---

### Task 16: Note.md

**Files:**
- Create: `Note.md`

- [ ] **Step 1: Write the learning notes**

Mirrors the backend's `Note.md` — rationale, not documentation. Create `Note.md`:

```markdown
# Kawi Frontend — Notes

Design rationale and things learned. The spec lives in
`docs/superpowers/specs/`; this file is for the *why*.

## Why every API call goes through a server function

Tokens live in an httpOnly session cookie, which JavaScript cannot read — so
the browser physically cannot attach an `Authorization` header. Any
authenticated call therefore has to run on the server.

Routing *reads* through server functions too, which is a separate decision. A
TanStack Router `loader` runs on the server for the first request but in the
browser for client-side navigations. Calling a server function instead of
`fetch` means the API call happens server-side either way. Consequences:
CORS never applies, the API URL never reaches the client, and error handling
lives in one place.

## SSR is a per-route decision, not a global one

Server functions and SSR are independent, and conflating them means paying
to render pages nobody indexes.

- Public catalog: `ssr: true` — the only pages a crawler sees.
- Auth forms: `ssr: true` — `beforeLoad` runs server-side, so an
  already-signed-in visitor is redirected away before any HTML ships.
- `/account`, `/admin`: `ssr: 'data-only'` — no SEO value, but `beforeLoad`
  still runs on the server, which is what makes a clean auth redirect
  possible instead of a spinner-then-flash.
- `/cart`: `ssr: false`, and not by choice — the cart is in `localStorage`,
  so the server cannot know its contents and SSR would hydration-mismatch.

Inheritance only tightens: `true → 'data-only' → false`, never back.

## Money is a string

`price`, `total`, and `ratingsAverage` come back as decimal strings from
Postgres `numeric`. Parsing them into floats reintroduces the rounding error
the column type exists to avoid, so `lib/money.ts` converts to integer cents
and back. `0.10 × 3` must be `0.30`, not `0.30000000000000004`.

One asymmetry to remember: reads return `price` as a string, but book
*create* accepts it as a number and the backend converts it.

## Server functions are the security boundary, not routes

Every `createServerFn` is a real RPC endpoint reachable by direct POST,
whatever route rendered the UI that calls it. Hiding an admin route protects
nothing. Role checks belong inside each server function — and the backend's
`authorize()` middleware stays the actual authority, because the frontend
must never be the only gate.

## Sort fields are a whitelist

The backend validates `sortBy` against a fixed list per resource and returns
400 for anything else. The sort UI offers exactly those values; the schema in
`schemas/catalog.ts` is the single place they are written down.

Books allow `title`, `price`, `publishedDate`, `stock`, `createdAt`. Authors
allow `name`, `email`, `birthDate`, `createdAt` — and authors take no `search`
param at all, unlike books.

## Environment

`.env` is gitignored, so the variables live here rather than in a committed
`.env.example`:

| Variable | Purpose |
|---|---|
| `KAWI_API_URL` | Base URL of the backend. Server-side only; never reaches the browser. `http://localhost:8000` for local work. |
| `SESSION_PASSWORD` | Signs the session cookie. Must be ≥32 characters. Unused until M3, but validated from the start so a missing value fails at boot rather than at first login. |

`src/env.ts` parses both with Zod and throws with the offending field named, so
a misconfigured environment fails immediately instead of surfacing as a
confusing runtime error.
```

- [ ] **Step 2: Commit**

```bash
git add Note.md
git commit -m "docs: add frontend learning notes"
```

---

## Definition of done

- [ ] `bun run typecheck` passes
- [ ] `bun run test` passes — 36 unit tests across env, api-error, api-client, money, catalog-schema
- [ ] `bun run test:e2e` passes — 3 smoke tests
- [ ] `curl -s http://localhost:3000/books | grep -c "rounded-lg border p-4"` returns non-zero, proving SSR
- [ ] Every `@tanstack/*` dependency is pinned to an exact version
- [ ] `.env` exists locally, is gitignored, and its variables are documented in `Note.md`
- [ ] Navigating `/` → `/books` → book detail → author detail works without a full page reload
- [ ] A nonexistent book id renders the error boundary with the backend's message

## Follow-on work, not in this plan

| Milestone | Adds |
|---|---|
| M3 | `session.ts`, login/signup/logout, single-flight refresh, `/account` |
| M4 | localStorage cart, checkout, order history |
| M5 | Reviews — public list plus purchase-gated form |
| M6 | Console shell, books/authors CRUD with per-row ownership |
| M7 | Admin orders and users — **requires `GET /api/v1/users` on the backend** |
