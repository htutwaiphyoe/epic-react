import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
	return (
		<h1 className="font-semibold text-4xl tracking-tight">
			Chess books, catalogued.
		</h1>
	);
}
