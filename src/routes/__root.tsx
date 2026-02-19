import { TanStackDevtools } from "@tanstack/react-devtools";
import {
	createRootRoute,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { Footer } from "#/components/layout/Footer";
import { Header } from "#/components/layout/Header";
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

function Shell({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex min-h-screen flex-col">
			<Header />
			<main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
				{children}
			</main>
			<Footer />
		</div>
	);
}

function RootLayout() {
	return (
		<Shell>
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
				<TanStackDevtools
					config={{ position: "bottom-right" }}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
