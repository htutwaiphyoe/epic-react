import { getEnv } from "#/env";
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
	const url = new URL(`${getEnv().KAWI_API_URL}/api/v1${path}`);

	for (const [key, value] of Object.entries(query ?? {})) {
		if (value !== undefined) {
			url.searchParams.set(key, String(value));
		}
	}

	return url.toString();
};

const safeJsonParse = (raw: string): unknown => {
	try {
		return JSON.parse(raw);
	} catch {
		return undefined;
	}
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
			body:
				options.body === undefined ? undefined : JSON.stringify(options.body),
		});
	} catch {
		throw new ApiClientError(0, "Could not reach the Kawi API.");
	}

	const raw = await response.text();
	const parsed = raw.length > 0 ? safeJsonParse(raw) : undefined;

	if (!response.ok) {
		throw normalizeApiError(response.status, parsed ?? raw);
	}

	return parsed as T;
};
