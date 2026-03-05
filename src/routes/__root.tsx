import {
	createRootRoute,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { getSessionUserFn } from "@/server/auth";
import { getCartFn } from "@/server/cart";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
	ssr: true,
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "Kawi — chess books" },
		],
		links: [{ rel: "stylesheet", href: appCss }],
	}),
	loader: async () => {
		const user = await getSessionUserFn();

		if (!user || user.role === "admin") {
			return { user, cartCount: 0, cartBookIds: [] as string[] };
		}

		try {
			const cart = await getCartFn();

			return {
				user,
				cartCount: cart.itemCount,
				cartBookIds: cart.items.map((line) => line.bookId),
			};
		} catch {
			return { user, cartCount: 0, cartBookIds: [] as string[] };
		}
	},
	shellComponent: RootDocument,
	component: RootLayout,
	errorComponent: ({ error }) => (
		<Shell>
			<h1 className="font-semibold text-2xl tracking-tight">
				Something went wrong
			</h1>
			<p className="mt-3 text-muted-foreground">{error.message}</p>
		</Shell>
	),
	notFoundComponent: () => (
		<Shell>
			<h1 className="font-semibold text-2xl tracking-tight">Page not found</h1>
			<p className="mt-3 text-muted-foreground">
				That page does not exist. Try the book catalog instead.
			</p>
		</Shell>
	),
});

function Shell({
	children,
	user,
	cartCount,
}: {
	children: React.ReactNode;
	user?: { name: string; role: string } | null;
	cartCount?: number;
}) {
	return (
		<div className="flex min-h-screen flex-col">
			<Header user={user ?? null} cartCount={cartCount ?? 0} />
			<main className="mx-auto w-full max-w-6xl flex-1 px-6 pt-14 pb-4">
				{children}
			</main>
			<Footer />
		</div>
	);
}

function RootLayout() {
	const { user, cartCount } = Route.useLoaderData();

	return (
		<Shell user={user} cartCount={cartCount}>
			<Outlet />
		</Shell>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<Scripts />
			</body>
		</html>
	);
}
