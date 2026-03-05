import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { BookEditor } from "@/features/admin/BookEditor";
import { createBookFn } from "@/server/admin";
import { getAuthorsFn } from "@/server/authors";

export const Route = createFileRoute("/admin/books/new")({
	loader: () =>
		getAuthorsFn({
			data: { page: 1, limit: 100, sortBy: "name", orderBy: "asc" },
		}),
	component: NewBookPage,
});

function NewBookPage() {
	const { authors } = Route.useLoaderData();
	const router = useRouter();

	return (
		<>
			<Link
				to="/admin/books"
				className="text-muted-foreground text-sm transition-colors hover:text-foreground"
			>
				← Books
			</Link>

			<h1 className="mt-8 text-4xl leading-[1.1]">New book</h1>

			<div className="mt-9">
				<BookEditor
					authors={authors}
					submitLabel="Create book"
					onSubmit={async (values) => {
						await createBookFn({ data: values });
						await router.invalidate();
						router.navigate({ to: "/admin/books" });
					}}
				/>
			</div>
		</>
	);
}
