import { describe, expect, it } from "vitest";
import { authorsSearchSchema, booksSearchSchema } from "@/schemas/catalog";

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
		for (const sortBy of [
			"title",
			"price",
			"publishedDate",
			"stock",
			"createdAt",
		]) {
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

	it("accepts every sort field the backend allows", () => {
		for (const sortBy of ["name", "email", "birthDate", "createdAt"]) {
			expect(authorsSearchSchema.parse({ sortBy }).sortBy).toBe(sortBy);
		}
	});

	it("rejects a books-only sort field", () => {
		expect(() => authorsSearchSchema.parse({ sortBy: "price" })).toThrow();
	});
});
