import { Link } from "@tanstack/react-router";
import { formatMoney, formatRating } from "@/lib/money";
import type { Book } from "@/server/types";

export const BookCard = ({ book }: { book: Book }) => (
	<Link
		to="/books/$bookId"
		params={{ bookId: book.id }}
		className="flex flex-col rounded-lg border p-5 transition-colors hover:border-foreground/30 hover:bg-muted/40"
	>
		<h3 className="font-medium leading-snug">{book.title}</h3>

		<div className="mt-auto flex items-baseline justify-between pt-6 text-sm">
			<span className="font-semibold text-base">{formatMoney(book.price)}</span>

			<span className="text-muted-foreground">
				{book.ratingsCount > 0
					? `${formatRating(book.ratingsAverage, book.ratingsCount)} · ${book.ratingsCount}`
					: "No ratings"}
			</span>
		</div>

		{book.stock === 0 ? (
			<span className="mt-2 text-destructive text-xs">Out of stock</span>
		) : null}
	</Link>
);
