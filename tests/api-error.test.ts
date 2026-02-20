import { describe, expect, it } from "vitest";
import { ApiClientError, normalizeApiError } from "@/server/api-error";

describe("normalizeApiError", () => {
	it("normalizes an ApiError body", () => {
		const error = normalizeApiError(404, {
			status: "error",
			message: "Book is not found.",
		});

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
