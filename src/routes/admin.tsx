import {
	createFileRoute,
	Link,
	Outlet,
	redirect,
} from "@tanstack/react-router";
import { BookText, LayoutDashboard, Package, Star, Users } from "lucide-react";
import { getSessionUserFn } from "@/server/auth";

export const Route = createFileRoute("/admin")({
	ssr: "data-only",
	beforeLoad: async ({ location }) => {
		const user = await getSessionUserFn();

		if (!user) {
			throw redirect({ to: "/login", search: { redirect: location.href } });
		}

		if (user.role !== "admin" && user.role !== "publisher") {
			throw redirect({ to: "/" });
		}

		return { user };
	},
	component: ConsoleLayout,
});

const NAV = [
	{
		to: "/admin",
		label: "Overview",
		icon: LayoutDashboard,
		exact: true,
		adminOnly: false,
	},
	{
		to: "/admin/books",
		label: "Books",
		icon: BookText,
		exact: false,
		adminOnly: false,
	},
	{
		to: "/admin/authors",
		label: "Authors",
		icon: Users,
		exact: false,
		adminOnly: false,
	},
	{
		to: "/admin/orders",
		label: "Orders",
		icon: Package,
		exact: false,
		adminOnly: true,
	},
	{
		to: "/admin/reviews",
		label: "Reviews",
		icon: Star,
		exact: false,
		adminOnly: true,
	},
] as const;

function ConsoleLayout() {
	const { user } = Route.useRouteContext();

	if (!user) {
		return null;
	}

	return (
		<div className="grid gap-10 pb-16 lg:grid-cols-[13rem_1fr] lg:items-start">
			<aside className="min-w-0 lg:sticky lg:top-24">
				<p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
					Console
				</p>
				<p className="mt-2 font-serif text-lg capitalize">{user.role}</p>

				<nav className="mt-6 flex gap-1 overflow-x-auto lg:flex-col">
					{NAV.filter((item) => !item.adminOnly || user.role === "admin").map(
						(item) => (
							<Link
								key={item.to}
								to={item.to}
								activeOptions={{ exact: item.exact }}
								activeProps={{ className: "bg-muted text-foreground" }}
								className="flex shrink-0 items-center gap-2.5 rounded-sm px-3 py-2 text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground"
							>
								<item.icon className="size-4" strokeWidth={1.75} />
								{item.label}
							</Link>
						),
					)}
				</nav>
			</aside>

			<div className="min-w-0">
				<Outlet />
			</div>
		</div>
	);
}
