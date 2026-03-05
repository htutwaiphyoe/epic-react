import { createServerFn } from "@tanstack/react-start";
import {
	forgotPasswordSchema,
	loginSchema,
	profileSchema,
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
	writeUser,
} from "./session";
import type { ProfileResponse } from "./types";

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

export const updateProfileFn = createServerFn({ method: "POST" })
	.validator(profileSchema)
	.handler(async ({ data }) => {
		const session = await readSession();
		const current = session.user;

		if (!current) {
			throw new Error("You are not signed in.");
		}

		const body = await authedRequest<ProfileResponse>(`/users/${current.id}`, {
			method: "PATCH",
			body: data,
		});

		await writeUser({ ...current, name: body.user.name });

		return body.user;
	});

export const getProfileFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const body = await authedRequest<ProfileResponse>("/users/me");

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
