export type Book = {
	id: string;
	title: string;
	authorId: string;
	isbn: string | null;
	description: string | null;
	price: string;
	publishedDate: string;
	stock: number;
	ratingsAverage: string;
	ratingsCount: number;
	createdBy: string | null;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
};

export type Author = {
	id: string;
	name: string;
	email: string;
	phone: string | null;
	bio: string | null;
	nationality: string | null;
	birthDate: string | null;
	createdBy: string | null;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
};

export type BookWithAuthor = Book & { author: Author | null };

export type Pagination = {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
};

export type BooksResponse = {
	status: "success";
	pagination: Pagination;
	books: Book[];
};

export type BookResponse = { status: "success"; book: BookWithAuthor };

export type AuthorsResponse = {
	status: "success";
	pagination: Pagination;
	authors: Author[];
};

export type AuthorResponse = { status: "success"; author: Author };
