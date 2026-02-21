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
