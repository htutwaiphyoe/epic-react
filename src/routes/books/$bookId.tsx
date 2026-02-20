import { createFileRoute, Link } from "@tanstack/react-router";
import { formatMoney, formatRating } from "@/lib/money";
import { getBookFn } from "@/server/books";

export const Route = createFileRoute("/books/$bookId")({
	ssr: true,
	loader: ({ params }) => getBookFn({ data: { bookId: params.bookId } }),
	component: BookDetailPage,
});

function BookDetailPage() {
	const book = Route.useLoaderData();

	const facts = [
		{ label: "Price", value: formatMoney(book.price) },
		{
			label: "Rating",
			value: formatRating(book.ratingsAverage, book.ratingsCount),
		},
		{ label: "In stock", value: String(book.stock) },
		{ label: "Published", value: book.publishedDate },
	];

	return (
		<article className="max-w-2xl">
			<h1 className="font-semibold text-3xl leading-tight tracking-tight">
				{book.title}
			</h1>

			{book.author ? (
				<Link
					to="/authors/$authorId"
					params={{ authorId: book.author.id }}
					className="mt-2 inline-block text-muted-foreground transition-colors hover:text-foreground"
				>
					{book.author.name}
					{book.author.nationality ? ` · ${book.author.nationality}` : ""}
				</Link>
			) : null}

			<dl className="mt-8 grid grid-cols-2 gap-6 border-y py-6 sm:grid-cols-4">
				{facts.map((fact) => (
					<div key={fact.label}>
						<dt className="text-muted-foreground text-sm">{fact.label}</dt>
						<dd className="mt-1 font-semibold text-lg">{fact.value}</dd>
					</div>
				))}
			</dl>

			{book.description ? (
				<p className="mt-8 leading-relaxed">{book.description}</p>
			) : null}

			{book.isbn ? (
				<p className="mt-8 text-muted-foreground text-sm">ISBN {book.isbn}</p>
			) : null}

			<Link
				to="/books"
				className="mt-10 inline-block text-muted-foreground text-sm transition-colors hover:text-foreground"
			>
				‹ All books
			</Link>
		</article>
	);
}
