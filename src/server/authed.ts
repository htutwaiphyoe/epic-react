import { ApiClientError, type RequestOptions, requestApi } from "./api-client";
import { coordinate } from "./refresh-coordinator";
import { clearSession, readSession, writeTokens } from "./session";

type RefreshResponse = {
	status: "success";
	accessToken: string;
	refreshToken: string;
};

export class SessionExpiredError extends Error {
	constructor(message = "Your session has expired. Please sign in again.") {
		super(message);
		this.name = "SessionExpiredError";
	}
}

const isUnauthorized = (error: unknown) =>
	error instanceof ApiClientError && error.status === 401;

export const authedRequest = async <T>(
	path: string,
	options: RequestOptions = {},
): Promise<T> => {
	const session = await readSession();

	if (!session.accessToken || !session.refreshToken) {
		throw new SessionExpiredError("You are not signed in.");
	}

	try {
		return await requestApi<T>(path, {
			...options,
			accessToken: session.accessToken,
		});
	} catch (error) {
		if (!isUnauthorized(error)) {
			throw error;
		}
	}

	const presented = session.refreshToken;
	let rotated: RefreshResponse;

	try {
		rotated = await coordinate(presented, () =>
			requestApi<RefreshResponse>("/auth/refresh", {
				method: "POST",
				body: { refreshToken: presented },
			}),
		);
	} catch {
		await clearSession();
		throw new SessionExpiredError();
	}

	await writeTokens(rotated.accessToken, rotated.refreshToken);

	try {
		return await requestApi<T>(path, {
			...options,
			accessToken: rotated.accessToken,
		});
	} catch (error) {
		if (isUnauthorized(error)) {
			await clearSession();
			throw new SessionExpiredError();
		}
		throw error;
	}
};
