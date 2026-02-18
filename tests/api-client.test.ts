import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClientError, requestApi } from "#/server/api-client";

const jsonResponse = (status: number, body: unknown) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { "content-type": "application/json" },
	});

const firstCall = (mock: ReturnType<typeof vi.spyOn>) => {
	const call = mock.mock.calls[0] ?? [];
	return {
		url: String(call[0]),
		init: (call[1] ?? {}) as RequestInit,
	};
};

const stubFetch = (status: number, body: unknown) =>
	vi
		.spyOn(globalThis, "fetch")
		.mockResolvedValue(jsonResponse(status, body)) as ReturnType<
		typeof vi.spyOn
	>;

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
		const mock = stubFetch(200, { status: "success", books: [] });

		await requestApi("/books");

		expect(firstCall(mock).url).toBe("http://api.test/api/v1/books");
	});

	it("serializes query params and omits undefined values", async () => {
		const mock = stubFetch(200, { status: "success", books: [] });

		await requestApi("/books", {
			query: { page: 2, search: undefined, limit: 20 },
		});

		expect(firstCall(mock).url).toBe(
			"http://api.test/api/v1/books?page=2&limit=20",
		);
	});

	it("attaches a bearer token when given one", async () => {
		const mock = stubFetch(200, { status: "success" });

		await requestApi("/users/me", { accessToken: "tok123" });

		const headers = new Headers(firstCall(mock).init.headers);
		expect(headers.get("authorization")).toBe("Bearer tok123");
	});

	it("sends no authorization header without a token", async () => {
		const mock = stubFetch(200, { status: "success" });

		await requestApi("/books");

		const headers = new Headers(firstCall(mock).init.headers);
		expect(headers.has("authorization")).toBe(false);
	});

	it("returns the parsed body on success", async () => {
		stubFetch(200, {
			status: "success",
			book: { id: "b1", title: "Zurich 1953" },
		});

		const body = await requestApi<{ book: { id: string; title: string } }>(
			"/books/b1",
		);

		expect(body.book.title).toBe("Zurich 1953");
	});

	it("throws a normalized ApiClientError on an error status", async () => {
		stubFetch(404, { status: "error", message: "Book is not found." });

		await expect(requestApi("/books/missing")).rejects.toMatchObject({
			status: 404,
			message: "Book is not found.",
		});
	});

	it("throws ApiClientError with status 0 when the network fails", async () => {
		vi.spyOn(globalThis, "fetch").mockRejectedValue(
			new TypeError("fetch failed"),
		);

		const error = await requestApi("/books").catch((e: unknown) => e);

		expect(error).toBeInstanceOf(ApiClientError);
		expect((error as ApiClientError).status).toBe(0);
	});

	it("sends a JSON body and content-type for POST", async () => {
		const mock = stubFetch(201, { status: "success" });

		await requestApi("/orders", { method: "POST", body: { items: [] } });

		const { init } = firstCall(mock);
		expect(init.method).toBe("POST");
		expect(init.body).toBe(JSON.stringify({ items: [] }));
		expect(new Headers(init.headers).get("content-type")).toBe(
			"application/json",
		);
	});
});
