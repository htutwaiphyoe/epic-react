import { createFileRoute, Link } from "@tanstack/react-router";
import { Pencil, Plus } from "lucide-react";
import { BookCover } from "@/features/books/BookCover";
import { Pagination } from "@/features/shared/Pagination";
import { formatMoney } from "@/lib/money";
import { booksSearchSchema } from "@/schemas/catalog";
import { getBooksFn } from "@/server/books";

export const Route = createFileRoute("/admin/books/")({
	validateSearch: booksSearchSchema,
	loaderDeps: ({ search }) => search,
	loader: ({ deps }) => getBooksFn({ data: deps }),
	component: AdminBooksPage,
});

function AdminBooksPage() {
	const { books, pagination } = Route.useLoaderData();
	const { user } = Route.useRouteContext();

	const canEdit = (createdBy: string | null) =>
		user?.role === "admin" || (Boolean(user) && createdBy === user.id);

	return (
		<>
			<header className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
						{pagination.total} titles
					</p>
					<h1 className="mt-3 text-4xl leading-[1.1]">Books</h1>
				</div>

				<Link
					to="/admin/books/new"
					className="inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-2.5 font-medium text-primary-foreground text-sm transition-opacity hover:opacity-90"
				>
					<Plus className="size-4" strokeWidth={2} />
					New book
				</Link>
			</header>

			<div className="mt-8 divide-y border-t border-b">
				{books.map((book) => (
					<div key={book.id} className="flex items-center gap-4 py-4">
						<div className="w-10 shrink-0 self-start overflow-hidden rounded-sm ring-1 ring-black/10">
							<BookCover
								title={book.title}
								seed={book.id}
								coverUrl={book.coverUrl}
							/>
						</div>

						<div className="min-w-0 flex-1">
							<p className="truncate font-medium">{book.title}</p>
							<p className="mt-1 text-muted-foreground text-sm tabular-nums">
								{formatMoney(book.price)} · {book.stock} in stock
							</p>
						</div>

						{canEdit(book.createdBy) ? (
							<Link
								to="/admin/books/$bookId"
								params={{ bookId: book.id }}
								className="inline-flex shrink-0 items-center gap-1.5 rounded-sm border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
							>
								<Pencil className="size-3.5" strokeWidth={1.75} />
								Edit
							</Link>
						) : (
							<span className="shrink-0 text-muted-foreground text-xs uppercase tracking-[0.1em]">
								Not yours
							</span>
						)}
					</div>
				))}
			</div>

			<Pagination pagination={pagination} />
		</>
	);
}
