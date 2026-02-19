import axios, { AxiosError, AxiosHeaders } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	ApiClientError,
	REQUEST_TIMEOUT_MS,
	requestApi,
} from "#/server/api-client";

const stubRequest = (data: unknown) =>
	vi.spyOn(axios, "request").mockResolvedValue({ status: 200, data });

const configOf = (spy: ReturnType<typeof stubRequest>) =>
	spy.mock.calls[0]?.[0] ?? {};

const axiosErrorWithResponse = (status: number, data: unknown) => {
	const error = new AxiosError("failed", "ERR_BAD_REQUEST");
	error.response = {
		status,
		data,
		statusText: "",
		headers: new AxiosHeaders(),
		config: { headers: new AxiosHeaders() },
	};
	return error;
};

describe("requestApi", () => {
	beforeEach(() => {
		vi.stubEnv("KAWI_API_URL", "http://api.test");
		vi.stubEnv("SESSION_PASSWORD", "x".repeat(32));
	});

	afterEach(() => {
		vi.unstubAllEnvs();
		vi.restoreAllMocks();
	});

	it("sets the base URL to the API's versioned namespace", async () => {
		const spy = stubRequest({ status: "success", books: [] });

		await requestApi("/books");

		const config = configOf(spy);
		expect(config.baseURL).toBe("http://api.test/api/v1");
		expect(config.url).toBe("/books");
	});

	it("passes query params through, dropping undefined values", async () => {
		const spy = stubRequest({ status: "success", books: [] });

		await requestApi("/books", {
			query: { page: 2, search: undefined, limit: 20 },
		});

		expect(configOf(spy).params).toEqual({ page: 2, limit: 20 });
	});

	it("applies a request timeout", async () => {
		const spy = stubRequest({ status: "success" });

		await requestApi("/books");

		expect(configOf(spy).timeout).toBe(REQUEST_TIMEOUT_MS);
	});

	it("attaches a bearer token when given one", async () => {
		const spy = stubRequest({ status: "success" });

		await requestApi("/users/me", { accessToken: "tok123" });

		expect(configOf(spy).headers?.authorization).toBe("Bearer tok123");
	});

	it("sends no authorization header without a token", async () => {
		const spy = stubRequest({ status: "success" });

		await requestApi("/books");

		expect(configOf(spy).headers?.authorization).toBeUndefined();
	});

	it("returns the response body on success", async () => {
		stubRequest({
			status: "success",
			book: { id: "b1", title: "Zurich 1953" },
		});

		const body = await requestApi<{ book: { id: string; title: string } }>(
			"/books/b1",
		);

		expect(body.book.title).toBe("Zurich 1953");
	});

	it("throws a normalized ApiClientError on an error status", async () => {
		vi.spyOn(axios, "request").mockRejectedValue(
			axiosErrorWithResponse(404, {
				status: "error",
				message: "Book is not found.",
			}),
		);

		await expect(requestApi("/books/missing")).rejects.toMatchObject({
			status: 404,
			message: "Book is not found.",
		});
	});

	it("maps a validation error into fieldErrors", async () => {
		vi.spyOn(axios, "request").mockRejectedValue(
			axiosErrorWithResponse(400, {
				status: "error",
				message: "Invalid request data.",
				errors: [{ path: "sortBy", message: "Invalid option" }],
			}),
		);

		const error = (await requestApi("/books").catch(
			(e: unknown) => e,
		)) as ApiClientError;

		expect(error.status).toBe(400);
		expect(error.fieldErrors).toEqual({ sortBy: "Invalid option" });
	});

	it("throws ApiClientError with status 0 when the network fails", async () => {
		vi.spyOn(axios, "request").mockRejectedValue(
			new AxiosError("Network Error", "ERR_NETWORK"),
		);

		const error = (await requestApi("/books").catch(
			(e: unknown) => e,
		)) as ApiClientError;

		expect(error).toBeInstanceOf(ApiClientError);
		expect(error.status).toBe(0);
	});

	it("throws ApiClientError with status 0 when the request times out", async () => {
		vi.spyOn(axios, "request").mockRejectedValue(
			new AxiosError("timeout of 10000ms exceeded", "ECONNABORTED"),
		);

		const error = (await requestApi("/books").catch(
			(e: unknown) => e,
		)) as ApiClientError;

		expect(error).toBeInstanceOf(ApiClientError);
		expect(error.status).toBe(0);
	});

	it("sends the method, body and content-type for POST", async () => {
		const spy = stubRequest({ status: "success" });

		await requestApi("/orders", { method: "POST", body: { items: [] } });

		const config = configOf(spy);
		expect(config.method).toBe("POST");
		expect(config.data).toEqual({ items: [] });
		expect(config.headers?.["content-type"]).toBe("application/json");
	});
});
