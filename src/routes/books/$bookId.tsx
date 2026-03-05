import { createFileRoute, Link, useLoaderData } from "@tanstack/react-router";
import { BookCover } from "@/features/books/BookCover";
import { AddToCart } from "@/features/cart/AddToCart";
import { BookReviews } from "@/features/reviews/BookReviews";
import { formatMoney, formatRating } from "@/lib/money";
import { getBookFn } from "@/server/books";
import { getBookReviewsFn, getReviewEligibilityFn } from "@/server/reviews";

export const Route = createFileRoute("/books/$bookId")({
	ssr: true,
	loader: async ({ params }) => {
		const [book, reviews, eligibility] = await Promise.all([
			getBookFn({ data: { bookId: params.bookId } }),
			getBookReviewsFn({
				data: {
					bookId: params.bookId,
					page: 1,
					limit: 20,
					sortBy: "createdAt",
					orderBy: "desc",
				},
			}),
			getReviewEligibilityFn({ data: { bookId: params.bookId } }),
		]);

		return {
			book,
			reviews: reviews.reviews,
			reviewTotal: reviews.pagination.total,
			eligibility,
		};
	},
	component: BookDetailPage,
});

function BookDetailPage() {
	const { book, reviews, reviewTotal, eligibility } = Route.useLoaderData();
	const { user, cartBookIds } = useLoaderData({ from: "__root__" });
	const canShop = user?.role !== "admin";

	const facts = [
		{ label: "Published", value: book.publishedDate.slice(0, 4) },
		{ label: "In stock", value: String(book.stock) },
		{
			label: "Rating",
			value: formatRating(book.ratingsAverage, book.ratingsCount),
		},
		book.isbn ? { label: "ISBN", value: book.isbn } : null,
	].filter((fact): fact is { label: string; value: string } => fact !== null);

	return (
		<>
			<Link
				to="/books"
				className="text-muted-foreground text-sm transition-colors hover:text-foreground"
			>
				← All books
			</Link>

			<article className="mt-8 grid items-start gap-12 lg:grid-cols-[300px_1fr]">
				<div className="mx-auto w-full max-w-[300px] overflow-hidden rounded-sm shadow-xl ring-1 ring-black/10">
					<BookCover
						title={book.title}
						seed={book.id}
						coverUrl={book.coverUrl}
						size="detail"
					/>
				</div>

				<div className="max-w-xl">
					<h1 className="text-4xl leading-[1.1]">{book.title}</h1>

					{book.author ? (
						<Link
							to="/authors/$authorId"
							params={{ authorId: book.author.id }}
							className="mt-3 inline-block text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground"
						>
							{book.author.name}
							{book.author.nationality ? `, ${book.author.nationality}` : ""}
						</Link>
					) : null}

					<p className="mt-7 font-serif text-3xl tabular-nums">
						{formatMoney(book.price)}
					</p>

					{book.description ? (
						<p className="mt-7 text-[17px] leading-relaxed">
							{book.description}
						</p>
					) : null}

					<dl className="mt-9 grid grid-cols-2 gap-y-5 border-t pt-7 sm:grid-cols-4">
						{facts.map((fact) => (
							<div key={fact.label}>
								<dt className="text-muted-foreground text-xs uppercase tracking-[0.14em]">
									{fact.label}
								</dt>
								<dd className="mt-1.5 tabular-nums">{fact.value}</dd>
							</div>
						))}
					</dl>

					<AddToCart
						bookId={book.id}
						stock={book.stock}
						signedIn={Boolean(user)}
						canShop={canShop}
						inCart={cartBookIds.includes(book.id)}
					/>
				</div>
			</article>

			<BookReviews
				bookId={book.id}
				reviews={reviews}
				total={reviewTotal}
				currentUserId={user?.id ?? null}
				canReview={canShop}
				eligibility={eligibility}
			/>
		</>
	);
}
