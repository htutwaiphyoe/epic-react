import { createFileRoute } from "@tanstack/react-router";
import { BookGrid } from "@/features/books/BookGrid";
import { Pagination } from "@/features/shared/Pagination";
import { SearchInput } from "@/features/shared/SearchInput";
import type { SortOption } from "@/features/shared/SortSelect";
import { SortSelect } from "@/features/shared/SortSelect";
import { type BooksSearch, booksSearchSchema } from "@/schemas/catalog";
import { getBooksFn } from "@/server/books";

const SORT_OPTIONS: readonly SortOption<BooksSearch["sortBy"]>[] = [
	{ value: "createdAt", label: "Newest" },
	{ value: "ratingsAverage", label: "Rating" },
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
			<header className="pb-8">
				<h1 className="text-4xl">Books</h1>
				<p className="mt-2 text-muted-foreground">
					{search.search ? (
						<>
							{pagination.total}{" "}
							{pagination.total === 1 ? "book matches" : "books match"}{" "}
							<span className="text-foreground">“{search.search}”</span>
						</>
					) : (
						<>
							Openings, middlegames, endgames — {pagination.total} ways to get
							better.
						</>
					)}
				</p>
			</header>

			<div className="rule-above flex flex-wrap items-center justify-between gap-4 py-5">
				<SearchInput
					value={search.search ?? ""}
					placeholder="Search titles…"
					onChange={(value) =>
						navigate({
							search: (prev) => ({ ...prev, search: value, page: 1 }),
							replace: true,
							resetScroll: false,
						})
					}
				/>

				<SortSelect
					options={SORT_OPTIONS}
					sortBy={search.sortBy}
					orderBy={search.orderBy}
					onChange={(next) =>
						navigate({ search: (prev) => ({ ...prev, ...next, page: 1 }) })
					}
				/>
			</div>

			<div className="pt-9">
				<BookGrid books={books} />
				<Pagination pagination={pagination} />
			</div>
		</>
	);
}
