import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/authors/")({ component: AuthorsPage });

function AuthorsPage() {
	return <h1 className="font-semibold text-2xl tracking-tight">Authors</h1>;
}
