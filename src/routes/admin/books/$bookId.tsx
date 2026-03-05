import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { BookEditor } from "@/features/admin/BookEditor";
import { deleteBookFn, updateBookFn } from "@/server/admin";
import { getAuthorsFn } from "@/server/authors";
import { getBookFn } from "@/server/books";

export const Route = createFileRoute("/admin/books/$bookId")({
	loader: async ({ params }) => {
		const [book, authors] = await Promise.all([
			getBookFn({ data: { bookId: params.bookId } }),
			getAuthorsFn({
				data: { page: 1, limit: 100, sortBy: "name", orderBy: "asc" },
			}),
		]);

		return { book, authors: authors.authors };
	},
	component: EditBookPage,
});

function EditBookPage() {
	const { book, authors } = Route.useLoaderData();
	const router = useRouter();

	const done = async () => {
		await router.invalidate();
		router.navigate({ to: "/admin/books" });
	};

	return (
		<>
			<Link
				to="/admin/books"
				className="text-muted-foreground text-sm transition-colors hover:text-foreground"
			>
				← Books
			</Link>

			<h1 className="mt-8 text-4xl leading-[1.1]">{book.title}</h1>

			<div className="mt-9">
				<BookEditor
					authors={authors}
					submitLabel="Save changes"
					initial={{
						title: book.title,
						authorId: book.authorId,
						isbn: book.isbn ?? "",
						description: book.description ?? "",
						coverUrl: book.coverUrl ?? "",
						price: book.price,
						publishedDate: book.publishedDate.slice(0, 10),
						stock: String(book.stock),
					}}
					onSubmit={async (values) => {
						await updateBookFn({ data: { bookId: book.id, ...values } });
						await done();
					}}
					onDelete={async () => {
						await deleteBookFn({ data: { bookId: book.id } });
						await done();
					}}
				/>
			</div>
		</>
	);
}
