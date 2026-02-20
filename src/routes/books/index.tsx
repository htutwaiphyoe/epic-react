import { createFileRoute } from "@tanstack/react-router";
import { BookGrid } from "@/features/books/BookGrid";
import { Pagination } from "@/features/shared/Pagination";
import type { SortOption } from "@/features/shared/SortSelect";
import { SortSelect } from "@/features/shared/SortSelect";
import { type BooksSearch, booksSearchSchema } from "@/schemas/catalog";
import { getBooksFn } from "@/server/books.server";

const SORT_OPTIONS: readonly SortOption<BooksSearch["sortBy"]>[] = [
	{ value: "createdAt", label: "Newest" },
	{ value: "title", label: "Title" },
	{ value: "price", label: "Price" },
	{ value: "publishedDate", label: "Published" },
	{ value: "stock", label: "Stock" },
];

export const Route = createFileRoute("/books/")({
	ssr: true,
	validateSearch: booksSearchSchema,
	loaderDeps: ({ search }) => search,
	loader: ({ deps }) => getBooksFn({ data: deps }),
	component: BooksPage,
});

function BooksPage() {
	const { books, pagination } = Route.useLoaderData();
	const search = Route.useSearch();
	const navigate = Route.useNavigate();

	return (
		<>
			<div className="mb-8 flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="font-semibold text-2xl tracking-tight">Books</h1>
					<p className="mt-1 text-muted-foreground text-sm">
						{pagination.total} in the catalog
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<form
						onSubmit={(event) => {
							event.preventDefault();
							const value = new FormData(event.currentTarget)
								.get("search")
								?.toString()
								.trim();
							navigate({
								search: (prev) => ({
									...prev,
									search: value || undefined,
									page: 1,
								}),
							});
						}}
					>
						<input
							name="search"
							type="search"
							placeholder="Search titles…"
							defaultValue={search.search ?? ""}
							className="rounded-md border bg-background px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						/>
					</form>

					<SortSelect
						options={SORT_OPTIONS}
						sortBy={search.sortBy}
						orderBy={search.orderBy}
						onChange={(next) =>
							navigate({ search: (prev) => ({ ...prev, ...next, page: 1 }) })
						}
					/>
				</div>
			</div>

			<BookGrid books={books} />
			<Pagination pagination={pagination} />
		</>
	);
}
