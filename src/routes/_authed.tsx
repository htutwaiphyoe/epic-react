import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getSessionUserFn } from "@/server/auth";

export const Route = createFileRoute("/_authed")({
	ssr: "data-only",
	beforeLoad: async ({ location }) => {
		const user = await getSessionUserFn();

		if (!user) {
			throw redirect({ to: "/login", search: { redirect: location.href } });
		}

		return { user };
	},
	component: Outlet,
});
