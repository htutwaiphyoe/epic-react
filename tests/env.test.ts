import { describe, expect, it } from "vitest";
import { parseEnv } from "#/env";

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
		expect(
			parseEnv({ ...valid, KAWI_API_URL: "http://localhost:8000/" })
				.KAWI_API_URL,
		).toBe("http://localhost:8000");
	});
});
