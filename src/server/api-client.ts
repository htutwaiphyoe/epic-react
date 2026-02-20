import axios from "axios";
import { getEnv } from "@/env";
import { ApiClientError, normalizeApiError } from "./api-error";

export { ApiClientError, normalizeApiError };

export const REQUEST_TIMEOUT_MS = 10_000;

type QueryValue = string | number | boolean | undefined;

export type RequestOptions = {
	method?: "GET" | "POST" | "PATCH" | "DELETE";
	query?: Record<string, QueryValue>;
	body?: unknown;
	accessToken?: string;
};

const definedParams = (
	query: Record<string, QueryValue> | undefined,
): Record<string, string | number | boolean> =>
	Object.fromEntries(
		Object.entries(query ?? {}).filter(
			(entry): entry is [string, string | number | boolean] =>
				entry[1] !== undefined,
		),
	);

export const requestApi = async <T>(
	path: string,
	options: RequestOptions = {},
): Promise<T> => {
	const headers: Record<string, string> = {};

	if (options.accessToken) {
		headers.authorization = `Bearer ${options.accessToken}`;
	}

	if (options.body !== undefined) {
		headers["content-type"] = "application/json";
	}

	try {
		const response = await axios.request<T>({
			baseURL: `${getEnv().KAWI_API_URL}/api/v1`,
			url: path,
			method: options.method ?? "GET",
			params: definedParams(options.query),
			headers,
			data: options.body,
			timeout: REQUEST_TIMEOUT_MS,
		});

		return response.data;
	} catch (error) {
		if (axios.isAxiosError(error)) {
			if (error.response) {
				throw normalizeApiError(error.response.status, error.response.data);
			}

			throw new ApiClientError(0, "Could not reach the Kawi API.");
		}

		throw error;
	}
};
