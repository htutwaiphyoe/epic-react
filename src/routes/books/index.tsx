import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/books/")({ component: BooksPage });

function BooksPage() {
	return <h1 className="font-semibold text-2xl tracking-tight">Books</h1>;
}
