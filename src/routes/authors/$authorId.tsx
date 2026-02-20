import { createFileRoute, Link } from "@tanstack/react-router";
import { BookGrid } from "@/features/books/BookGrid";
import { Pagination } from "@/features/shared/Pagination";
import { booksSearchSchema } from "@/schemas/catalog";
import { getAuthorFn } from "@/server/authors";
import { getBooksByAuthorFn } from "@/server/books";

export const Route = createFileRoute("/authors/$authorId")({
	ssr: true,
	validateSearch: booksSearchSchema,
	loaderDeps: ({ search }) => search,
	loader: async ({ params, deps }) => {
		const [author, books] = await Promise.all([
			getAuthorFn({ data: { authorId: params.authorId } }),
			getBooksByAuthorFn({ data: { ...deps, authorId: params.authorId } }),
		]);

		return { author, ...books };
	},
	component: AuthorDetailPage,
});

function AuthorDetailPage() {
	const { author, books, pagination } = Route.useLoaderData();

	return (
		<>
			<header className="mb-10 max-w-2xl">
				<h1 className="font-semibold text-3xl tracking-tight">{author.name}</h1>

				<p className="mt-2 text-muted-foreground">
					{[author.nationality, author.birthDate]
						.filter(Boolean)
						.join(" · born ")}
				</p>

				{author.bio ? (
					<p className="mt-5 leading-relaxed">{author.bio}</p>
				) : null}
			</header>

			<h2 className="mb-4 font-semibold text-xl tracking-tight">
				Books ({pagination.total})
			</h2>

			<BookGrid books={books} />
			<Pagination pagination={pagination} />

			<Link
				to="/authors"
				className="mt-10 inline-block text-muted-foreground text-sm transition-colors hover:text-foreground"
			>
				‹ All authors
			</Link>
		</>
	);
}
