import { createServerFn } from "@tanstack/react-start";
import {
	forgotPasswordSchema,
	loginSchema,
	resetPasswordSchema,
	signupSchema,
} from "@/schemas/auth";
import { requestApi } from "./api-client";
import { authedRequest } from "./authed";
import {
	clearSession,
	readSession,
	type SessionUser,
	startSession,
} from "./session";

type AuthResponse = {
	status: "success";
	accessToken: string;
	refreshToken: string;
	user: SessionUser;
};

type MessageResponse = { status: "success"; message: string };

export const signupFn = createServerFn({ method: "POST" })
	.validator(signupSchema)
	.handler(async ({ data }) => {
		const body = await requestApi<AuthResponse>("/auth/signup", {
			method: "POST",
			body: data,
		});

		await startSession({
			accessToken: body.accessToken,
			refreshToken: body.refreshToken,
			user: body.user,
		});

		return body.user;
	});

export const loginFn = createServerFn({ method: "POST" })
	.validator(loginSchema)
	.handler(async ({ data }) => {
		const body = await requestApi<AuthResponse>("/auth/login", {
			method: "POST",
			body: data,
		});

		await startSession({
			accessToken: body.accessToken,
			refreshToken: body.refreshToken,
			user: body.user,
		});

		return body.user;
	});

export const logoutFn = createServerFn({ method: "POST" }).handler(async () => {
	const session = await readSession();

	if (session.refreshToken) {
		await requestApi("/auth/logout", {
			method: "POST",
			body: { refreshToken: session.refreshToken },
		}).catch(() => undefined);
	}

	await clearSession();

	return { ok: true };
});

export const getSessionUserFn = createServerFn({ method: "GET" }).handler(
	async () => (await readSession()).user ?? null,
);

export const getProfileFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const body = await authedRequest<{ status: "success"; user: SessionUser }>(
			"/users/me",
		);

		return body.user;
	},
);

export const forgotPasswordFn = createServerFn({ method: "POST" })
	.validator(forgotPasswordSchema)
	.handler(async ({ data }) => {
		const body = await requestApi<MessageResponse>("/auth/forgot-password", {
			method: "POST",
			body: data,
		});

		return body.message;
	});

export const resetPasswordFn = createServerFn({ method: "POST" })
	.validator(resetPasswordSchema)
	.handler(async ({ data }) => {
		const body = await requestApi<MessageResponse>("/auth/reset-password", {
			method: "POST",
			body: data,
		});

		return body.message;
	});
