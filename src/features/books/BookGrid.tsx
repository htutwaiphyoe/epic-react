import type { Book } from "@/server/types";
import { BookCard } from "./BookCard";

export const BookGrid = ({ books }: { books: Book[] }) => {
	if (books.length === 0) {
		return (
			<div className="rounded-sm border border-dashed py-24 text-center">
				<p className="font-serif text-lg">Nothing here</p>
				<p className="mt-1 text-muted-foreground text-sm">
					No books matched your search.
				</p>
			</div>
		);
	}

	return (
		<div
			data-testid="book-grid"
			className="grid grid-cols-2 gap-x-6 gap-y-9 sm:grid-cols-3 lg:grid-cols-5"
		>
			{books.map((book) => (
				<BookCard key={book.id} book={book} />
			))}
		</div>
	);
};
