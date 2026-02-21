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
