import { createFileRoute, Link } from "@tanstack/react-router";
import { BookCover } from "@/features/books/BookCover";
import { BookGrid } from "@/features/books/BookGrid";
import { getBooksFn } from "@/server/books";

export const Route = createFileRoute("/")({
	ssr: true,
	loader: async () => {
		const [recent, popular] = await Promise.all([
			getBooksFn({
				data: { page: 1, limit: 10, sortBy: "createdAt", orderBy: "desc" },
			}),
			getBooksFn({
				data: { page: 1, limit: 10, sortBy: "ratingsCount", orderBy: "desc" },
			}),
		]);

		return {
			books: recent.books,
			pagination: recent.pagination,
			popular: popular.books
				.filter((book) => book.ratingsCount > 0)
				.slice(0, 5),
		};
	},
	component: Home,
});

function Home() {
	const { books, pagination, popular } = Route.useLoaderData();
	const featured = books.slice(0, 3);

	return (
		<>
			<section className="grid items-center gap-12 pb-20 lg:grid-cols-[1.1fr_1fr]">
				<div>
					<p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
						{pagination.total} titles
					</p>

					<h1 className="mt-5 text-[2.75rem] leading-[1.05] sm:text-6xl">
						The chess
						<br />
						bookshelf.
					</h1>

					<p className="mt-6 max-w-md text-[17px] text-muted-foreground leading-relaxed">
						From Nimzowitsch's hypermodern blockade to Dvoretsky's endgame
						drills — a catalog of the books that shaped how the game is
						understood.
					</p>

					<div className="mt-8 flex items-center gap-5">
						<Link
							to="/books"
							className="rounded-sm bg-primary px-5 py-2.5 font-medium text-primary-foreground text-sm transition-opacity hover:opacity-90"
						>
							Browse the catalog
						</Link>

						<Link
							to="/authors"
							className="text-sm underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
						>
							Meet the authors
						</Link>
					</div>
				</div>

				<div className="flex justify-center gap-4 lg:justify-end">
					{featured.map((book, index) => (
						<Link
							key={book.id}
							to="/books/$bookId"
							params={{ bookId: book.id }}
							className="w-1/3 max-w-[180px] shrink-0 overflow-hidden rounded-sm shadow-lg ring-1 ring-black/10 transition-transform duration-300 hover:-translate-y-1"
							style={{
								transform: `rotate(${(index - 1) * 3}deg) translateY(${
									index === 1 ? "-12px" : "0"
								})`,
							}}
						>
							<BookCover
								title={book.title}
								seed={book.id}
								coverUrl={book.coverUrl}
							/>
						</Link>
					))}
				</div>
			</section>

			{popular.length > 0 ? (
				<section className="rule-above pt-12">
					<div className="mb-7 flex items-baseline justify-between">
						<h2 className="text-2xl">Most read</h2>
						<p className="text-muted-foreground text-sm">
							What other readers are reviewing
						</p>
					</div>

					<BookGrid books={popular} />
				</section>
			) : null}

			<section className="rule-above mt-12 pt-12">
				<div className="mb-7 flex items-baseline justify-between">
					<h2 className="text-2xl">Recently added</h2>
					<Link
						to="/books"
						className="text-muted-foreground text-sm transition-colors hover:text-foreground"
					>
						All books →
					</Link>
				</div>

				<BookGrid books={books.slice(0, 5)} />
			</section>
		</>
	);
}
