import { createFileRoute, Link } from "@tanstack/react-router";
import { BookGrid } from "@/features/books/BookGrid";
import { getBooksFn } from "@/server/books";

export const Route = createFileRoute("/")({
	ssr: true,
	loader: () =>
		getBooksFn({
			data: { page: 1, limit: 6, sortBy: "createdAt", orderBy: "desc" },
		}),
	component: Home,
});

function Home() {
	const { books } = Route.useLoaderData();

	return (
		<>
			<section className="mb-14 max-w-2xl">
				<h1 className="font-semibold text-4xl tracking-tight">
					Chess books, catalogued.
				</h1>

				<p className="mt-4 text-lg text-muted-foreground">
					Browse the collection by title, price, or publication date — from
					Nimzowitsch to Dvoretsky.
				</p>

				<Link
					to="/books"
					className="mt-7 inline-block rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm transition-opacity hover:opacity-90"
				>
					Browse all books
				</Link>
			</section>

			<h2 className="mb-4 font-semibold text-xl tracking-tight">
				Recently added
			</h2>

			<BookGrid books={books} />
		</>
	);
}
