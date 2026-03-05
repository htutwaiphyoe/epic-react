import { Link } from "@tanstack/react-router";
import { formatMoney, formatRating } from "@/lib/money";
import type { Book } from "@/server/types";
import { BookCover } from "./BookCover";

export const BookCard = ({ book }: { book: Book }) => (
	<Link
		to="/books/$bookId"
		params={{ bookId: book.id }}
		className="group block"
	>
		<div className="overflow-hidden rounded-sm shadow-sm ring-1 ring-black/5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md">
			<BookCover title={book.title} seed={book.id} coverUrl={book.coverUrl} />
		</div>

		<div className="mt-3">
			<h3 className="font-medium text-[15px] leading-snug underline-offset-2 group-hover:underline">
				{book.title}
			</h3>

			<div className="mt-1 flex items-baseline gap-2.5 text-sm">
				<span className="tabular-nums">{formatMoney(book.price)}</span>

				{book.ratingsCount > 0 && (
					<span className="text-muted-foreground">
						★ {formatRating(book.ratingsAverage, book.ratingsCount)}
					</span>
				)}

				{book.stock === 0 && (
					<span className="text-destructive">Out of stock</span>
				)}
			</div>
		</div>
	</Link>
);
