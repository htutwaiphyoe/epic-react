import { describe, expect, it } from "vitest";
import {
	formatMoney,
	formatRating,
	multiplyMoney,
	sumMoney,
} from "#/lib/money";

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
