import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthorPortrait } from "@/features/authors/AuthorPortrait";
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

	const meta = [author.nationality, author.birthDate?.slice(0, 4)]
		.filter(Boolean)
		.join(" · ");

	return (
		<>
			<Link
				to="/authors"
				className="text-muted-foreground text-sm transition-colors hover:text-foreground"
			>
				← All authors
			</Link>

			<header className="mt-8 grid items-start gap-9 pb-12 sm:grid-cols-[220px_1fr]">
				<div className="w-full max-w-[220px] overflow-hidden rounded-sm shadow-lg ring-1 ring-black/10">
					<AuthorPortrait
						name={author.name}
						photoUrl={author.photoUrl}
						size="detail"
					/>
				</div>

				<div className="max-w-xl self-center">
					{meta ? (
						<p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
							{meta}
						</p>
					) : null}

					<h1 className="mt-4 text-5xl leading-[1.05]">{author.name}</h1>

					{author.bio ? (
						<p className="mt-6 text-[17px] leading-relaxed">{author.bio}</p>
					) : null}
				</div>
			</header>

			<section className="rule-above pt-12">
				<h2 className="mb-7 text-2xl">
					{pagination.total} {pagination.total === 1 ? "title" : "titles"}
				</h2>

				<BookGrid books={books} />

				{pagination.totalPages > 1 ? (
					<Pagination pagination={pagination} />
				) : null}
			</section>
		</>
	);
}
