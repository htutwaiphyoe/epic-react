import type { Book } from "@/server/types";
import { BookCard } from "./BookCard";

export const BookGrid = ({ books }: { books: Book[] }) => {
	if (books.length === 0) {
		return (
			<p className="py-20 text-center text-muted-foreground">
				No books matched your search.
			</p>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{books.map((book) => (
				<BookCard key={book.id} book={book} />
			))}
		</div>
	);
};
