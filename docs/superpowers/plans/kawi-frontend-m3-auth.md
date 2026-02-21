# Kawi Frontend M3 — Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A visitor can sign up, log in, stay logged in across reloads, view their profile, and log out — with tokens never reachable from JavaScript.

**Architecture:** Tokens live in a TanStack Start httpOnly session cookie. `requestApi` stays pure transport; a new `authedRequest` layer reads the session, retries once on 401 after a refresh, and clears the session if that fails. Refresh is single-flight **keyed by refresh token**, because the backend revokes a user's entire token family if a rotated token is presented twice.

**Tech Stack:** TanStack Start `useSession`, TanStack Form + Zod v4, Vitest, Playwright, Bun.

---

## Commit policy

⚠️ **Every commit is back-dated to a date the user supplies.** Never run a bare `git commit`. Ask for the date, then:

```bash
GIT_AUTHOR_DATE="<date the user gives>" \
GIT_COMMITTER_DATE="<date the user gives>" \
git commit -m "…"
```

Both variables are required — setting only the author date leaves the committer date as "now". Conventional Commits, enforced by the `commit-msg` hook.

## Repo conventions

- **No inline code comments.** Reasoning goes in `Note.md`.
- **`@/` import alias**, never `#/`.
- Never name a module containing `createServerFn` with a `.server.ts` suffix — Start blocks client imports of those and the client receives a mock. See `Note.md`.

## Scope

**In:** session module, auth server functions, single-flight refresh, `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/account`, and auth state in the header.

**Deferred, with reasons:**

- **`/account/orders`** — the spec puts order history in M4 alongside the cart, since both need `POST /orders` to have produced something.
- **Profile editing** — `/account` displays the profile in M3. `PATCH /users/:id` accepts `name`, `dob` and `profileUrl`; wiring an edit form is worth its own task once there is a second form pattern to share.
- **TanStack Query** — still nothing for it to cache. Mutations here are one-shot form submissions that end in a redirect, and route loaders already own the read path.
- **Mapping `fieldErrors` onto form inputs.** The spec calls for a 400's `errors[]` to land on the matching input. Two reasons to hold off: the client-side Zod schemas mirror the backend's rules, so a field-level server rejection is nearly unreachable in these four forms; and it is unverified whether `ApiClientError`'s custom properties survive serialisation across the server-function boundary, which needs checking before code depends on it. M6's admin CRUD is where this earns its place — more fields, and server-only rules like ISBN uniqueness that no client schema can predict. Until then a top-level banner carries the backend's message, which is already proven to work.

## The one thing that must not be got wrong

**Refresh must be keyed per refresh token, not module-global.**

Server functions run inside one long-lived server process shared by every visitor. A module-level `let refreshPromise` would mean user B, hitting a 401 while user A's refresh is in flight, awaits A's promise and receives **A's tokens** — a session-crossing bug that would be near-impossible to reproduce locally.

Keying by the presented refresh token gives exactly the right granularity: two concurrent requests from one browser share a token and therefore one refresh, while different users never collide.

This matters because the backend implements reuse detection — [auth.service.ts:98-101](../../../kawi-backend/features/auth/auth.service.ts#L98-L101) revokes the user's whole token family when an already-rotated refresh token is presented. Two parallel refreshes would log the user out entirely.

## File structure

| Path | Responsibility |
|---|---|
| `src/server/session.ts` | The **only** module that touches the session cookie |
| `src/server/refresh-coordinator.ts` | Pure keyed single-flight dedupe; no session or HTTP knowledge |
| `src/server/authed.ts` | Session-aware request: attach token, refresh once on 401, retry |
| `src/server/auth.ts` | `signupFn`, `loginFn`, `logoutFn`, `getSessionUserFn`, `getProfileFn`, `forgotPasswordFn`, `resetPasswordFn` |
| `src/schemas/auth.ts` | Zod schemas mirroring the backend's auth DTOs |
| `src/features/auth/FormField.tsx` | One labelled input bound to a TanStack Form field |
| `src/features/auth/FormError.tsx` | Top-level form error banner |
| `src/routes/login.tsx` | `ssr: true` |
| `src/routes/signup.tsx` | `ssr: true` |
| `src/routes/forgot-password.tsx` | `ssr: true` |
| `src/routes/reset-password.tsx` | `ssr: true`, reads `token` from search params |
| `src/routes/_authed.tsx` | Pathless layout holding the auth guard for every child |
| `src/routes/_authed/account.tsx` | `/account`, inherits the guard |
| `src/components/layout/Header.tsx` | Modified — shows account link or sign-in |
| `src/routes/__root.tsx` | Modified — loader supplies the session user |
| `tests/refresh-coordinator.test.ts` | 6 tests |
| `tests/auth-schema.test.ts` | 8 tests |
| `e2e/auth.spec.ts` | 5 journeys |

A pathless `_authed` layout is used rather than a guard on `/account` directly, so M4's `/account/orders` inherits it without duplicating the redirect logic. `_authed` contributes no path segment: `_authed/account.tsx` serves `/account`.

---

### Task 1: Install TanStack Form

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install**

```bash
bun add @tanstack/react-form
```

- [ ] **Step 2: Pin it, like every other TanStack package**

```bash
node -e '
const fs=require("fs"),p="package.json",d=JSON.parse(fs.readFileSync(p));
const v=JSON.parse(fs.readFileSync("node_modules/@tanstack/react-form/package.json")).version;
d.dependencies["@tanstack/react-form"]=v;
fs.writeFileSync(p,JSON.stringify(d,null,2)+"\n");
console.log("pinned @tanstack/react-form",v);
'
```

- [ ] **Step 3: Commit** (see Commit policy)

```bash
git add package.json bun.lock
git commit -m "chore: add tanstack form"
```

---

### Task 2: Auth schemas

Mirrors the backend DTOs so client-side validation matches server-side rules instead of guessing them.

**Files:**
- Create: `src/schemas/auth.ts`, `tests/auth-schema.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/auth-schema.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
	forgotPasswordSchema,
	loginSchema,
	resetPasswordSchema,
	signupSchema,
} from "@/schemas/auth";

describe("signupSchema", () => {
	const valid = {
		name: "Yoo Jae-suk",
		email: "yoojaesuk@mailinator.com",
		password: "supersecret123",
	};

	it("accepts a valid signup", () => {
		expect(signupSchema.parse(valid)).toEqual(valid);
	});

	it("rejects a password under 8 characters", () => {
		expect(() => signupSchema.parse({ ...valid, password: "short" })).toThrow();
	});

	it("rejects a malformed email", () => {
		expect(() => signupSchema.parse({ ...valid, email: "nope" })).toThrow();
	});

	it("rejects an empty name", () => {
		expect(() => signupSchema.parse({ ...valid, name: "" })).toThrow();
	});
});

describe("loginSchema", () => {
	it("accepts an email and any non-empty password", () => {
		const parsed = loginSchema.parse({
			email: "haha@mailinator.com",
			password: "x",
		});
		expect(parsed.email).toBe("haha@mailinator.com");
	});

	it("rejects an empty password", () => {
		expect(() =>
			loginSchema.parse({ email: "haha@mailinator.com", password: "" }),
		).toThrow();
	});
});

describe("forgotPasswordSchema", () => {
	it("requires a valid email", () => {
		expect(() => forgotPasswordSchema.parse({ email: "nope" })).toThrow();
	});
});

describe("resetPasswordSchema", () => {
	it("requires a token and an 8-character password", () => {
		expect(() =>
			resetPasswordSchema.parse({ token: "abc", password: "short" }),
		).toThrow();
	});
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
bun run test tests/auth-schema.test.ts
```

Expected: FAIL — `Cannot find module '@/schemas/auth'`.

- [ ] **Step 3: Implement**

Create `src/schemas/auth.ts`. The messages match the backend's so a client-side rejection reads the same as a server-side one:

```ts
import { z } from "zod";

const password = z
	.string()
	.min(8, "Password must be at least 8 characters");

export const signupSchema = z.object({
	name: z
		.string()
		.min(1, "Name is required")
		.max(255, "Name must be at most 255 characters"),
	email: z.email("Email must be a valid email"),
	password,
});

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
	email: z.email("Email must be a valid email"),
	password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
	email: z.email("Email must be a valid email"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
	token: z.string().min(1, "Token is required"),
	password,
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
bun run test tests/auth-schema.test.ts
```

Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add src/schemas/auth.ts tests/auth-schema.test.ts
git commit -m "feat: add auth form schemas"
```

---

### Task 3: Refresh coordinator

Pure keyed single-flight. Isolated from session and HTTP so it can be tested exhaustively — this is the module where a subtle bug would be a session-crossing security issue.

**Files:**
- Create: `src/server/refresh-coordinator.ts`, `tests/refresh-coordinator.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/refresh-coordinator.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { coordinate } from "@/server/refresh-coordinator";

const deferred = <T>() => {
	let resolve!: (value: T) => void;
	let reject!: (reason: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
};

describe("coordinate", () => {
	it("runs the work once for concurrent calls sharing a key", async () => {
		const gate = deferred<string>();
		const work = vi.fn(() => gate.promise);

		const a = coordinate("token-1", work);
		const b = coordinate("token-1", work);
		gate.resolve("fresh");

		await expect(a).resolves.toBe("fresh");
		await expect(b).resolves.toBe("fresh");
		expect(work).toHaveBeenCalledTimes(1);
	});

	it("keeps different keys independent", async () => {
		const work = vi.fn((value: string) => Promise.resolve(value));

		const [one, two] = await Promise.all([
			coordinate("token-a", () => work("a")),
			coordinate("token-b", () => work("b")),
		]);

		expect(one).toBe("a");
		expect(two).toBe("b");
		expect(work).toHaveBeenCalledTimes(2);
	});

	it("releases the key after success so a later call runs again", async () => {
		const work = vi.fn(() => Promise.resolve("value"));

		await coordinate("token-2", work);
		await coordinate("token-2", work);

		expect(work).toHaveBeenCalledTimes(2);
	});

	it("releases the key after failure", async () => {
		const failing = vi.fn(() => Promise.reject(new Error("boom")));

		await expect(coordinate("token-3", failing)).rejects.toThrow("boom");
		await expect(coordinate("token-3", failing)).rejects.toThrow("boom");

		expect(failing).toHaveBeenCalledTimes(2);
	});

	it("gives every concurrent caller the same rejection", async () => {
		const gate = deferred<string>();
		const work = vi.fn(() => gate.promise);

		const a = coordinate("token-4", work);
		const b = coordinate("token-4", work);
		gate.reject(new Error("refresh failed"));

		await expect(a).rejects.toThrow("refresh failed");
		await expect(b).rejects.toThrow("refresh failed");
		expect(work).toHaveBeenCalledTimes(1);
	});

	it("does not leak entries between keys after settling", async () => {
		await coordinate("token-5", () => Promise.resolve(1));
		const second = await coordinate("token-6", () => Promise.resolve(2));

		expect(second).toBe(2);
	});
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
bun run test tests/refresh-coordinator.test.ts
```

Expected: FAIL — `Cannot find module '@/server/refresh-coordinator'`.

- [ ] **Step 3: Implement**

Create `src/server/refresh-coordinator.ts`:

```ts
const inFlight = new Map<string, Promise<unknown>>();

export const coordinate = <T>(
	key: string,
	work: () => Promise<T>,
): Promise<T> => {
	const existing = inFlight.get(key) as Promise<T> | undefined;

	if (existing) {
		return existing;
	}

	const promise = work().finally(() => {
		inFlight.delete(key);
	});

	inFlight.set(key, promise);

	return promise;
};
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
bun run test tests/refresh-coordinator.test.ts
```

Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/server/refresh-coordinator.ts tests/refresh-coordinator.test.ts
git commit -m "feat: add keyed single-flight coordinator"
```

---

### Task 4: Session module

The only module that touches the session cookie.

**Files:**
- Create: `src/server/session.ts`

- [ ] **Step 1: Implement**

Create `src/server/session.ts`:

```ts
import { useSession } from "@tanstack/react-start/server";
import { getEnv } from "@/env";

export type SessionUser = {
	id: string;
	name: string;
	email: string;
	role: "user" | "publisher" | "admin";
};

export type SessionData = {
	accessToken?: string;
	refreshToken?: string;
	user?: SessionUser;
};

const appSession = () =>
	useSession<SessionData>({
		name: "kawi-session",
		password: getEnv().SESSION_PASSWORD,
		cookie: {
			httpOnly: true,
			sameSite: "lax",
			secure: process.env.NODE_ENV === "production",
			path: "/",
		},
	});

export const readSession = async (): Promise<SessionData> =>
	(await appSession()).data;

export const startSession = async (data: {
	accessToken: string;
	refreshToken: string;
	user: SessionUser;
}) => {
	const session = await appSession();
	await session.update(data);
};

export const writeTokens = async (
	accessToken: string,
	refreshToken: string,
) => {
	const session = await appSession();
	await session.update({ ...session.data, accessToken, refreshToken });
};

export const clearSession = async () => {
	const session = await appSession();
	await session.clear();
};
```

- [ ] **Step 2: Typecheck**

```bash
bun run typecheck
```

Expected: no errors. `sameSite: "lax"` is correct because the cookie is same-origin between browser and the Start server — the backend's own `sameSite: "strict"` cookies are never used.

- [ ] **Step 3: Commit**

```bash
git add src/server/session.ts
git commit -m "feat: add session module"
```

---

### Task 5: Authenticated request layer

**Files:**
- Create: `src/server/authed.ts`

- [ ] **Step 1: Implement**

Create `src/server/authed.ts`:

```ts
import { ApiClientError, type RequestOptions, requestApi } from "./api-client";
import { coordinate } from "./refresh-coordinator";
import { clearSession, readSession, writeTokens } from "./session";

type RefreshResponse = {
	status: "success";
	accessToken: string;
	refreshToken: string;
};

export class SessionExpiredError extends Error {
	constructor(message = "Your session has expired. Please sign in again.") {
		super(message);
		this.name = "SessionExpiredError";
	}
}

const isUnauthorized = (error: unknown) =>
	error instanceof ApiClientError && error.status === 401;

export const authedRequest = async <T>(
	path: string,
	options: RequestOptions = {},
): Promise<T> => {
	const session = await readSession();

	if (!session.accessToken || !session.refreshToken) {
		throw new SessionExpiredError("You are not signed in.");
	}

	try {
		return await requestApi<T>(path, {
			...options,
			accessToken: session.accessToken,
		});
	} catch (error) {
		if (!isUnauthorized(error)) {
			throw error;
		}
	}

	const presented = session.refreshToken;
	let rotated: RefreshResponse;

	try {
		rotated = await coordinate(presented, () =>
			requestApi<RefreshResponse>("/auth/refresh", {
				method: "POST",
				body: { refreshToken: presented },
			}),
		);
	} catch {
		await clearSession();
		throw new SessionExpiredError();
	}

	await writeTokens(rotated.accessToken, rotated.refreshToken);

	try {
		return await requestApi<T>(path, {
			...options,
			accessToken: rotated.accessToken,
		});
	} catch (error) {
		if (isUnauthorized(error)) {
			await clearSession();
			throw new SessionExpiredError();
		}
		throw error;
	}
};
```

- [ ] **Step 2: Typecheck**

```bash
bun run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/server/authed.ts
git commit -m "feat: add authenticated request layer with refresh and retry"
```

---

### Task 6: Auth server functions

**Files:**
- Create: `src/server/auth.ts`

- [ ] **Step 1: Implement**

Create `src/server/auth.ts`. Note the filename is `auth.ts`, **not** `auth.server.ts`:

```ts
import { createServerFn } from "@tanstack/react-start";
import {
	forgotPasswordSchema,
	loginSchema,
	resetPasswordSchema,
	signupSchema,
} from "@/schemas/auth";
import { requestApi } from "./api-client";
import { authedRequest } from "./authed";
import {
	clearSession,
	readSession,
	type SessionUser,
	startSession,
} from "./session";

type AuthResponse = {
	status: "success";
	accessToken: string;
	refreshToken: string;
	user: SessionUser;
};

type MessageResponse = { status: "success"; message: string };

export const signupFn = createServerFn({ method: "POST" })
	.validator(signupSchema)
	.handler(async ({ data }) => {
		const body = await requestApi<AuthResponse>("/auth/signup", {
			method: "POST",
			body: data,
		});

		await startSession({
			accessToken: body.accessToken,
			refreshToken: body.refreshToken,
			user: body.user,
		});

		return body.user;
	});

export const loginFn = createServerFn({ method: "POST" })
	.validator(loginSchema)
	.handler(async ({ data }) => {
		const body = await requestApi<AuthResponse>("/auth/login", {
			method: "POST",
			body: data,
		});

		await startSession({
			accessToken: body.accessToken,
			refreshToken: body.refreshToken,
			user: body.user,
		});

		return body.user;
	});

export const logoutFn = createServerFn({ method: "POST" }).handler(async () => {
	const session = await readSession();

	if (session.refreshToken) {
		await requestApi("/auth/logout", {
			method: "POST",
			body: { refreshToken: session.refreshToken },
		}).catch(() => undefined);
	}

	await clearSession();

	return { ok: true };
});

export const getSessionUserFn = createServerFn({ method: "GET" }).handler(
	async () => (await readSession()).user ?? null,
);

export const getProfileFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const body = await authedRequest<{ status: "success"; user: SessionUser }>(
			"/users/me",
		);

		return body.user;
	},
);

export const forgotPasswordFn = createServerFn({ method: "POST" })
	.validator(forgotPasswordSchema)
	.handler(async ({ data }) => {
		const body = await requestApi<MessageResponse>("/auth/forgot-password", {
			method: "POST",
			body: data,
		});

		return body.message;
	});

export const resetPasswordFn = createServerFn({ method: "POST" })
	.validator(resetPasswordSchema)
	.handler(async ({ data }) => {
		const body = await requestApi<MessageResponse>("/auth/reset-password", {
			method: "POST",
			body: data,
		});

		return body.message;
	});
```

Three deliberate choices.

`logoutFn` swallows a failing backend logout, so a revoked or expired token still clears the local session — otherwise a user with a stale session could never sign out.

`getSessionUserFn` reads the cookie only, no API call, because login already stored the user. That is what the header uses on every navigation.

`getProfileFn` is the opposite: it goes through `authedRequest` to `GET /users/me`. This is what gives `authed.ts` a real consumer in M3. Without it the whole refresh path would ship unused and unexercised, and nothing would prove the access token in the session actually works against the backend rather than merely being stored. Header reads the cheap cached copy; `/account` reads the authoritative one.

- [ ] **Step 2: Typecheck**

```bash
bun run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/server/auth.ts
git commit -m "feat: add auth server functions"
```

---

### Task 7: Form building blocks

**Files:**
- Create: `src/features/auth/FormField.tsx`, `src/features/auth/FormError.tsx`

- [ ] **Step 1: Create the error banner**

Create `src/features/auth/FormError.tsx`:

```tsx
export const FormError = ({ message }: { message?: string }) =>
	message ? (
		<p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive text-sm">
			{message}
		</p>
	) : null;
```

- [ ] **Step 2: Create the field**

Create `src/features/auth/FormField.tsx`:

```tsx
type Props = {
	label: string;
	name: string;
	type?: "text" | "email" | "password";
	value: string;
	errors: string[];
	autoComplete?: string;
	onChange: (value: string) => void;
	onBlur: () => void;
};

export const FormField = ({
	label,
	name,
	type = "text",
	value,
	errors,
	autoComplete,
	onChange,
	onBlur,
}: Props) => (
	<div className="flex flex-col gap-1.5">
		<label htmlFor={name} className="font-medium text-sm">
			{label}
		</label>

		<input
			id={name}
			name={name}
			type={type}
			value={value}
			autoComplete={autoComplete}
			onChange={(event) => onChange(event.target.value)}
			onBlur={onBlur}
			className="rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
		/>

		{errors.length > 0 ? (
			<p className="text-destructive text-sm">{errors[0]}</p>
		) : null}
	</div>
);
```

- [ ] **Step 3: Typecheck and commit**

```bash
bun run typecheck
git add src/features/auth
git commit -m "feat: add auth form building blocks"
```

---

### Task 8: Login route

**Files:**
- Create: `src/routes/login.tsx`

- [ ] **Step 1: Implement**

Create `src/routes/login.tsx`. `ssr: true` so `beforeLoad` can bounce an already-signed-in visitor before any HTML ships:

```tsx
import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { FormError } from "@/features/auth/FormError";
import { FormField } from "@/features/auth/FormField";
import { loginSchema } from "@/schemas/auth";
import { getSessionUserFn, loginFn } from "@/server/auth";

export const Route = createFileRoute("/login")({
	ssr: true,
	validateSearch: z.object({ redirect: z.string().optional() }),
	beforeLoad: async ({ search }) => {
		if (await getSessionUserFn()) {
			throw redirect({ to: search.redirect ?? "/account" });
		}
	},
	component: LoginPage,
});

function LoginPage() {
	const router = useRouter();
	const search = Route.useSearch();
	const [error, setError] = useState<string>();

	const form = useForm({
		defaultValues: { email: "", password: "" },
		onSubmit: async ({ value }) => {
			setError(undefined);
			try {
				await loginFn({ data: value });
				await router.invalidate();
				router.navigate({ to: search.redirect ?? "/account" });
			} catch (cause) {
				setError(
					cause instanceof Error ? cause.message : "Could not sign you in.",
				);
			}
		},
	});

	return (
		<div className="mx-auto max-w-sm">
			<h1 className="font-semibold text-2xl tracking-tight">Sign in</h1>

			<form
				className="mt-8 flex flex-col gap-5"
				onSubmit={(event) => {
					event.preventDefault();
					form.handleSubmit();
				}}
			>
				<FormError message={error} />

				<form.Field
					name="email"
					validators={{ onChange: loginSchema.shape.email }}
					children={(field) => (
						<FormField
							label="Email"
							name="email"
							type="email"
							autoComplete="email"
							value={field.state.value}
							errors={field.state.meta.errors.map(String)}
							onChange={field.handleChange}
							onBlur={field.handleBlur}
						/>
					)}
				/>

				<form.Field
					name="password"
					validators={{ onChange: loginSchema.shape.password }}
					children={(field) => (
						<FormField
							label="Password"
							name="password"
							type="password"
							autoComplete="current-password"
							value={field.state.value}
							errors={field.state.meta.errors.map(String)}
							onChange={field.handleChange}
							onBlur={field.handleBlur}
						/>
					)}
				/>

				<form.Subscribe
					selector={(state) => state.isSubmitting}
					children={(isSubmitting) => (
						<button
							type="submit"
							disabled={isSubmitting}
							className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm disabled:opacity-60"
						>
							{isSubmitting ? "Signing in…" : "Sign in"}
						</button>
					)}
				/>
			</form>

			<div className="mt-6 flex justify-between text-muted-foreground text-sm">
				<Link to="/signup" className="hover:text-foreground">
					Create an account
				</Link>
				<Link to="/forgot-password" className="hover:text-foreground">
					Forgot password?
				</Link>
			</div>
		</div>
	);
}
```

⚠️ `form.Subscribe` with a `selector` is the one API here not confirmed against the docs during planning. If it errors, replace it with a local `useState` submitting flag set around the `loginFn` call.

- [ ] **Step 2: Regenerate routes and typecheck**

```bash
bun run generate-routes && bun run typecheck
```

- [ ] **Step 3: Verify against the running backend**

Start the backend (`cd ../kawi-backend && bun run dev`) and the frontend (`bun run dev`), then sign in at `http://localhost:3000/login` as `yoojaesuk@mailinator.com` / `RunningMan2010!`. Expected: redirect to `/account`.

Confirm the cookie is not readable from JavaScript — in the browser console:

```js
document.cookie.includes("kawi-session")
```

Expected: `false`, because the cookie is httpOnly.

- [ ] **Step 4: Commit**

```bash
git add src/routes/login.tsx src/routeTree.gen.ts
git commit -m "feat: add login route"
```

---

### Task 9: Signup route

**Files:**
- Create: `src/routes/signup.tsx`

- [ ] **Step 1: Implement**

Create `src/routes/signup.tsx`:

```tsx
import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { FormError } from "@/features/auth/FormError";
import { FormField } from "@/features/auth/FormField";
import { signupSchema } from "@/schemas/auth";
import { getSessionUserFn, signupFn } from "@/server/auth";

export const Route = createFileRoute("/signup")({
	ssr: true,
	beforeLoad: async () => {
		if (await getSessionUserFn()) {
			throw redirect({ to: "/account" });
		}
	},
	component: SignupPage,
});

function SignupPage() {
	const router = useRouter();
	const [error, setError] = useState<string>();

	const form = useForm({
		defaultValues: { name: "", email: "", password: "" },
		onSubmit: async ({ value }) => {
			setError(undefined);
			try {
				await signupFn({ data: value });
				await router.invalidate();
				router.navigate({ to: "/account" });
			} catch (cause) {
				setError(
					cause instanceof Error
						? cause.message
						: "Could not create your account.",
				);
			}
		},
	});

	return (
		<div className="mx-auto max-w-sm">
			<h1 className="font-semibold text-2xl tracking-tight">
				Create an account
			</h1>

			<form
				className="mt-8 flex flex-col gap-5"
				onSubmit={(event) => {
					event.preventDefault();
					form.handleSubmit();
				}}
			>
				<FormError message={error} />

				<form.Field
					name="name"
					validators={{ onChange: signupSchema.shape.name }}
					children={(field) => (
						<FormField
							label="Name"
							name="name"
							autoComplete="name"
							value={field.state.value}
							errors={field.state.meta.errors.map(String)}
							onChange={field.handleChange}
							onBlur={field.handleBlur}
						/>
					)}
				/>

				<form.Field
					name="email"
					validators={{ onChange: signupSchema.shape.email }}
					children={(field) => (
						<FormField
							label="Email"
							name="email"
							type="email"
							autoComplete="email"
							value={field.state.value}
							errors={field.state.meta.errors.map(String)}
							onChange={field.handleChange}
							onBlur={field.handleBlur}
						/>
					)}
				/>

				<form.Field
					name="password"
					validators={{ onChange: signupSchema.shape.password }}
					children={(field) => (
						<FormField
							label="Password"
							name="password"
							type="password"
							autoComplete="new-password"
							value={field.state.value}
							errors={field.state.meta.errors.map(String)}
							onChange={field.handleChange}
							onBlur={field.handleBlur}
						/>
					)}
				/>

				<form.Subscribe
					selector={(state) => state.isSubmitting}
					children={(isSubmitting) => (
						<button
							type="submit"
							disabled={isSubmitting}
							className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm disabled:opacity-60"
						>
							{isSubmitting ? "Creating…" : "Create account"}
						</button>
					)}
				/>
			</form>

			<p className="mt-6 text-muted-foreground text-sm">
				Already have an account?{" "}
				<Link to="/login" className="hover:text-foreground">
					Sign in
				</Link>
			</p>
		</div>
	);
}
```

- [ ] **Step 2: Verify a duplicate email surfaces the backend's message**

Regenerate routes, then sign up with `yoojaesuk@mailinator.com`. Expected: the banner reads `Email already registered.` — that string comes from the backend's `CONSTRAINT_MESSAGES` via `normalizeApiError`, proving the whole error path works end to end.

```bash
bun run generate-routes && bun run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add src/routes/signup.tsx src/routeTree.gen.ts
git commit -m "feat: add signup route"
```

---

### Task 10: Password reset routes

**Files:**
- Create: `src/routes/forgot-password.tsx`, `src/routes/reset-password.tsx`

- [ ] **Step 1: Create the request form**

Create `src/routes/forgot-password.tsx`. The backend returns the same message whether or not the account exists, so the UI must not imply otherwise:

```tsx
import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { FormError } from "@/features/auth/FormError";
import { FormField } from "@/features/auth/FormField";
import { forgotPasswordSchema } from "@/schemas/auth";
import { forgotPasswordFn } from "@/server/auth";

export const Route = createFileRoute("/forgot-password")({
	ssr: true,
	component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
	const [error, setError] = useState<string>();
	const [sent, setSent] = useState<string>();

	const form = useForm({
		defaultValues: { email: "" },
		onSubmit: async ({ value }) => {
			setError(undefined);
			try {
				setSent(await forgotPasswordFn({ data: value }));
			} catch (cause) {
				setError(
					cause instanceof Error ? cause.message : "Could not send the email.",
				);
			}
		},
	});

	return (
		<div className="mx-auto max-w-sm">
			<h1 className="font-semibold text-2xl tracking-tight">Reset password</h1>

			{sent ? (
				<p className="mt-6 text-muted-foreground">{sent}</p>
			) : (
				<form
					className="mt-8 flex flex-col gap-5"
					onSubmit={(event) => {
						event.preventDefault();
						form.handleSubmit();
					}}
				>
					<FormError message={error} />

					<form.Field
						name="email"
						validators={{ onChange: forgotPasswordSchema.shape.email }}
						children={(field) => (
							<FormField
								label="Email"
								name="email"
								type="email"
								autoComplete="email"
								value={field.state.value}
								errors={field.state.meta.errors.map(String)}
								onChange={field.handleChange}
								onBlur={field.handleBlur}
							/>
						)}
					/>

					<button
						type="submit"
						className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm"
					>
						Send reset link
					</button>
				</form>
			)}

			<p className="mt-6 text-muted-foreground text-sm">
				<Link to="/login" className="hover:text-foreground">
					Back to sign in
				</Link>
			</p>
		</div>
	);
}
```

- [ ] **Step 2: Create the reset form**

Create `src/routes/reset-password.tsx`. The token arrives in the URL the worker emailed, built from `CLIENT_URL` as `/reset-password?token=…`:

```tsx
import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { FormError } from "@/features/auth/FormError";
import { FormField } from "@/features/auth/FormField";
import { resetPasswordSchema } from "@/schemas/auth";
import { resetPasswordFn } from "@/server/auth";

export const Route = createFileRoute("/reset-password")({
	ssr: true,
	validateSearch: z.object({ token: z.string().optional() }),
	component: ResetPasswordPage,
});

function ResetPasswordPage() {
	const router = useRouter();
	const { token } = Route.useSearch();
	const [error, setError] = useState<string>();

	const form = useForm({
		defaultValues: { password: "" },
		onSubmit: async ({ value }) => {
			setError(undefined);
			try {
				await resetPasswordFn({
					data: { token: token ?? "", password: value.password },
				});
				router.navigate({ to: "/login" });
			} catch (cause) {
				setError(
					cause instanceof Error
						? cause.message
						: "Could not reset your password.",
				);
			}
		},
	});

	if (!token) {
		return (
			<div className="mx-auto max-w-sm">
				<h1 className="font-semibold text-2xl tracking-tight">
					Reset password
				</h1>
				<p className="mt-3 text-muted-foreground">
					This link is missing its token. Request a new one.
				</p>
				<Link
					to="/forgot-password"
					className="mt-6 inline-block text-muted-foreground text-sm hover:text-foreground"
				>
					Request a new link
				</Link>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-sm">
			<h1 className="font-semibold text-2xl tracking-tight">
				Choose a new password
			</h1>

			<form
				className="mt-8 flex flex-col gap-5"
				onSubmit={(event) => {
					event.preventDefault();
					form.handleSubmit();
				}}
			>
				<FormError message={error} />

				<form.Field
					name="password"
					validators={{ onChange: resetPasswordSchema.shape.password }}
					children={(field) => (
						<FormField
							label="New password"
							name="password"
							type="password"
							autoComplete="new-password"
							value={field.state.value}
							errors={field.state.meta.errors.map(String)}
							onChange={field.handleChange}
							onBlur={field.handleBlur}
						/>
					)}
				/>

				<button
					type="submit"
					className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm"
				>
					Reset password
				</button>
			</form>
		</div>
	);
}
```

- [ ] **Step 3: Verify the invalid-token path**

```bash
bun run generate-routes && bun run typecheck
```

Visit `/reset-password?token=nonsense`, submit a valid password. Expected banner: `Invalid or expired reset token.` — straight from the backend.

- [ ] **Step 4: Commit**

```bash
git add src/routes/forgot-password.tsx src/routes/reset-password.tsx src/routeTree.gen.ts
git commit -m "feat: add password reset routes"
```

---

### Task 11: Guarded account route

**Files:**
- Create: `src/routes/_authed.tsx`, `src/routes/_authed/account.tsx`

- [ ] **Step 1: Create the guard layout**

Create `src/routes/_authed.tsx`. `ssr: 'data-only'` means `beforeLoad` runs on the server — so an unauthenticated visitor is redirected before any HTML ships, rather than seeing a flash of the page:

```tsx
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getSessionUserFn } from "@/server/auth";

export const Route = createFileRoute("/_authed")({
	ssr: "data-only",
	beforeLoad: async ({ location }) => {
		const user = await getSessionUserFn();

		if (!user) {
			throw redirect({ to: "/login", search: { redirect: location.href } });
		}

		return { user };
	},
	component: Outlet,
});
```

- [ ] **Step 2: Create the account page**

Create `src/routes/_authed/account.tsx`:

```tsx
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { getProfileFn, logoutFn } from "@/server/auth";

export const Route = createFileRoute("/_authed/account")({
	loader: () => getProfileFn(),
	component: AccountPage,
});

function AccountPage() {
	const router = useRouter();
	const user = Route.useLoaderData();

	const facts = [
		{ label: "Name", value: user.name },
		{ label: "Email", value: user.email },
		{ label: "Role", value: user.role },
	];

	return (
		<div className="max-w-lg">
			<h1 className="font-semibold text-2xl tracking-tight">Account</h1>

			<dl className="mt-8 divide-y rounded-lg border">
				{facts.map((fact) => (
					<div
						key={fact.label}
						className="flex items-baseline justify-between px-5 py-4"
					>
						<dt className="text-muted-foreground text-sm">{fact.label}</dt>
						<dd className="font-medium">{fact.value}</dd>
					</div>
				))}
			</dl>

			<button
				type="button"
				onClick={async () => {
					await logoutFn();
					await router.invalidate();
					router.navigate({ to: "/" });
				}}
				className="mt-8 rounded-md border px-4 py-2 font-medium text-sm transition-colors hover:bg-muted"
			>
				Sign out
			</button>
		</div>
	);
}
```

- [ ] **Step 3: Verify the guard redirects server-side**

```bash
bun run generate-routes && bun run typecheck
```

With no session, confirm the redirect happens before any HTML is produced:

```bash
curl -s -o /dev/null -w "%{http_code} -> %{redirect_url}\n" http://localhost:3000/account
```

Expected: a 3xx to `/login?redirect=…`. A `200` would mean the guard ran client-side instead, which is the bug `ssr: 'data-only'` exists to prevent.

- [ ] **Step 4: Commit**

```bash
git add src/routes/_authed.tsx src/routes/_authed/account.tsx src/routeTree.gen.ts
git commit -m "feat: add guarded account route"
```

---

### Task 12: Header auth state

**Files:**
- Modify: `src/routes/__root.tsx`, `src/components/layout/Header.tsx`

- [ ] **Step 1: Supply the session user from the root loader**

In `src/routes/__root.tsx`, add the import and loader, and pass the user through `RootLayout`:

```tsx
import { getSessionUserFn } from "@/server/auth";
```

Add `loader: () => getSessionUserFn(),` to the `createRootRoute` options, then change `RootLayout` to:

```tsx
function RootLayout() {
	const user = Route.useLoaderData();

	return (
		<Shell user={user}>
			<Outlet />
		</Shell>
	);
}
```

And give `Shell` the prop, passing it to `Header`:

```tsx
function Shell({
	children,
	user,
}: {
	children: React.ReactNode;
	user?: { name: string } | null;
}) {
	return (
		<div className="flex min-h-screen flex-col">
			<Header user={user ?? null} />
			<main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
				{children}
			</main>
			<Footer />
		</div>
	);
}
```

`errorComponent` and `notFoundComponent` call `Shell` without a `user`, which is why the prop is optional — they render outside a successful loader.

This is a cookie read rather than an API call, because `loginFn` stored the user in the session.

- [ ] **Step 2: Show auth state in the header**

Replace `src/components/layout/Header.tsx`:

```tsx
import { Link } from "@tanstack/react-router";

const navLinkClass = "transition-colors hover:text-foreground";
const activeProps = { className: "text-foreground font-medium" };

export const Header = ({ user }: { user: { name: string } | null }) => (
	<header className="border-b">
		<div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-4">
			<Link to="/" className="font-semibold text-lg tracking-tight">
				Kawi
			</Link>

			<nav className="flex gap-6 text-muted-foreground text-sm">
				<Link to="/books" className={navLinkClass} activeProps={activeProps}>
					Books
				</Link>
				<Link to="/authors" className={navLinkClass} activeProps={activeProps}>
					Authors
				</Link>
			</nav>

			<div className="ml-auto text-muted-foreground text-sm">
				{user ? (
					<Link to="/account" className={navLinkClass} activeProps={activeProps}>
						{user.name}
					</Link>
				) : (
					<Link to="/login" className={navLinkClass}>
						Sign in
					</Link>
				)}
			</div>
		</div>
	</header>
);
```

- [ ] **Step 3: Verify both states are server-rendered**

```bash
bun run typecheck
curl -s http://localhost:3000/ | grep -ao 'Sign in'
```

Expected: `Sign in` present when not signed in. After signing in through the browser, the header should show the user's name instead.

- [ ] **Step 4: Commit**

```bash
git add src/routes/__root.tsx src/components/layout/Header.tsx
git commit -m "feat: show auth state in the header"
```

---

### Task 13: Auth end-to-end tests

**Files:**
- Create: `e2e/auth.spec.ts`

- [ ] **Step 1: Write the tests**

Create `e2e/auth.spec.ts`. Each run registers a unique email so tests never collide, and `Ji Suk-jin`'s seeded account is used for the known-credentials cases:

```ts
import { expect, test } from "@playwright/test";

const SEEDED = { email: "jisukjin@mailinator.com", password: "RunningMan2010!" };

test("guards /account and redirects back after signing in", async ({ page }) => {
	await page.goto("/account");
	await expect(page).toHaveURL(/\/login/);

	await page.getByLabel("Email").fill(SEEDED.email);
	await page.getByLabel("Password").fill(SEEDED.password);
	await page.getByRole("button", { name: "Sign in" }).click();

	await expect(page).toHaveURL(/\/account/);
	await expect(page.getByRole("heading", { name: "Account" })).toBeVisible();
	await expect(page.getByText(SEEDED.email)).toBeVisible();
});

test("rejects a wrong password with the backend's message", async ({ page }) => {
	await page.goto("/login");

	await page.getByLabel("Email").fill(SEEDED.email);
	await page.getByLabel("Password").fill("definitely-wrong");
	await page.getByRole("button", { name: "Sign in" }).click();

	await expect(page.getByText("Invalid email or password.")).toBeVisible();
	await expect(page).toHaveURL(/\/login/);
});

test("signs up, lands on the account page, and survives a reload", async ({
	page,
}) => {
	const email = `e2e-${Date.now()}@mailinator.com`;

	await page.goto("/signup");
	await page.getByLabel("Name").fill("E2E Tester");
	await page.getByLabel("Email").fill(email);
	await page.getByLabel("Password").fill("supersecret123");
	await page.getByRole("button", { name: "Create account" }).click();

	await expect(page).toHaveURL(/\/account/);
	await expect(page.getByText(email)).toBeVisible();

	await page.reload();
	await expect(page.getByText(email)).toBeVisible();
});

test("signing out clears the session", async ({ page }) => {
	await page.goto("/login");
	await page.getByLabel("Email").fill(SEEDED.email);
	await page.getByLabel("Password").fill(SEEDED.password);
	await page.getByRole("button", { name: "Sign in" }).click();
	await expect(page).toHaveURL(/\/account/);

	await page.getByRole("button", { name: "Sign out" }).click();
	await expect(page).toHaveURL("/");
	await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();

	await page.goto("/account");
	await expect(page).toHaveURL(/\/login/);
});

test("the session cookie is not readable from JavaScript", async ({ page }) => {
	await page.goto("/login");
	await page.getByLabel("Email").fill(SEEDED.email);
	await page.getByLabel("Password").fill(SEEDED.password);
	await page.getByRole("button", { name: "Sign in" }).click();
	await expect(page).toHaveURL(/\/account/);

	const visible = await page.evaluate(() =>
		document.cookie.includes("kawi-session"),
	);
	expect(visible).toBe(false);
});
```

- [ ] **Step 2: Run them**

```bash
bun run test:e2e e2e/auth.spec.ts
```

Expected: 5 passed. Requires the backend running locally with the seeded users.

Note `/api/v1/auth` is rate limited to **10 requests per 15 minutes** by `authLimiter`. This file makes roughly 7 auth calls per full run, so two runs back to back will start returning 429. Restart the backend container to clear the in-memory counter: `docker restart kawi-backend-app-1`.

- [ ] **Step 3: Commit**

```bash
git add e2e/auth.spec.ts
git commit -m "test: add auth journeys"
```

---

### Task 14: Update Note.md

**Files:**
- Modify: `Note.md`

- [ ] **Step 1: Add the auth section**

Append to `Note.md`:

```markdown
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

`requestApi` was left untouched when auth landed, which is why its tests
still hold.

## Logout is deliberately forgiving

`logoutFn` swallows a failing backend logout. If the refresh token is already
revoked or expired the API call fails, but the local session must still be
cleared — otherwise a user with a stale session can never sign out.

## The header costs a cookie read, not an API call

`loginFn` stores the user in the session, so `getSessionUserFn` reads the
cookie and returns. The root loader calls it on every navigation; that is a
decrypt, not a request to the backend.
```

- [ ] **Step 2: Commit**

```bash
git add Note.md
git commit -m "docs: note the auth layering and refresh keying"
```

---

## Definition of done

- [ ] `bun run typecheck` passes
- [ ] `bun run test` passes — 55 unit tests (41 existing + 6 coordinator + 8 schema)
- [ ] `bun run test:e2e` passes — 11 tests (6 catalog + 5 auth)
- [ ] `bun run check` clean
- [ ] `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/account` returns a 3xx when signed out
- [ ] `document.cookie` does not contain `kawi-session` while signed in
- [ ] Signing in, reloading, and signing out all behave; the header reflects state
- [ ] A duplicate signup email shows `Email already registered.` from the backend

## Follow-on work

| Milestone | Adds |
|---|---|
| M4 | localStorage cart, checkout, `/account/orders` with cancel |
| M5 | Reviews — public list plus purchase-gated form |
| M6 | Console shell, books/authors CRUD with per-row publisher ownership |
| M7 | Admin orders and users — **requires `GET /api/v1/users` on the backend** |
