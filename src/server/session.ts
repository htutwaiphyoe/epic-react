import { useSession } from "@tanstack/react-start/server";
import { getEnv } from "@/env";

export type SessionUser = {
	id: string;
	name: string;
	email: string;
	role: "user" | "publisher" | "admin";
};

export type SessionData = {
	accessToken?: string;
	refreshToken?: string;
	user?: SessionUser;
};

const appSession = () =>
	useSession<SessionData>({
		name: "kawi-session",
		password: getEnv().SESSION_PASSWORD,
		cookie: {
			httpOnly: true,
			sameSite: "lax",
			secure: process.env.NODE_ENV === "production",
			path: "/",
		},
	});

export const readSession = async (): Promise<SessionData> =>
	(await appSession()).data;

export const startSession = async (data: {
	accessToken: string;
	refreshToken: string;
	user: SessionUser;
}) => {
	const session = await appSession();
	await session.update(data);
};

export const writeTokens = async (
	accessToken: string,
	refreshToken: string,
) => {
	const session = await appSession();
	await session.update({ ...session.data, accessToken, refreshToken });
};

export const clearSession = async () => {
	const session = await appSession();
	await session.clear();
};
