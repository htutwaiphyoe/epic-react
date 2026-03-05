export type Book = {
	id: string;
	title: string;
	authorId: string;
	isbn: string | null;
	description: string | null;
	coverUrl: string | null;
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
	photoUrl: string | null;
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

export type CartLine = {
	id: string;
	bookId: string;
	title: string;
	coverUrl: string | null;
	price: string;
	quantity: number;
	stock: number;
	amount: string;
	available: boolean;
};

export type Cart = {
	items: CartLine[];
	subtotal: string;
	itemCount: number;
	hasUnavailableItems: boolean;
};

export type CartResponse = { status: "success"; cart: Cart };

export type ShippingAddress = {
	recipient: string;
	phone: string;
	line1: string;
	line2?: string;
	city: string;
	postalCode?: string;
	country: string;
};

export type OrderStatus = "pending" | "paid" | "shipped" | "cancelled";

export type OrderItem = {
	id: string;
	orderId: string;
	bookId: string | null;
	title: string;
	price: string;
	quantity: number;
	coverUrl: string | null;
};

export type Order = {
	id: string;
	userId: string;
	status: OrderStatus;
	total: string;
	shippingAddress: ShippingAddress | null;
	createdAt: string;
	updatedAt: string;
	customer: { id: string; name: string; email: string };
};

export type OrderWithItems = Order & { items: OrderItem[] };

export type OrderResponse = { status: "success"; order: OrderWithItems };

export type OrdersResponse = {
	status: "success";
	pagination: Pagination;
	orders: OrderWithItems[];
};

export type Profile = {
	id: string;
	name: string;
	email: string;
	dob: string | null;
	profileUrl: string | null;
	role: "user" | "publisher" | "admin";
	createdAt: string;
	updatedAt: string;
};

export type ProfileResponse = { status: "success"; user: Profile };

export type Review = {
	id: string;
	rating: number;
	comment: string | null;
	createdAt: string;
	user: { id: string; name: string };
};

export type ReviewsResponse = {
	status: "success";
	pagination: Pagination;
	reviews: Review[];
};

export type ReviewResponse = { status: "success"; review: Review };

export type ReviewEligibility = {
	hasPurchased: boolean;
	reviewId: string | null;
	canReview: boolean;
};

export type ReviewEligibilityResponse = {
	status: "success";
	eligibility: ReviewEligibility;
};

export type MoneyPeriod = { orders: number; revenue: string };

export type OverviewReport = {
	generatedAt: string;
	since: { day: string; month: string };
	orders: {
		today: MoneyPeriod;
		month: MoneyPeriod;
		allTime: MoneyPeriod;
		awaiting: { orders: number; value: string };
		byStatus: Record<OrderStatus, number>;
		placed: number;
	};
	trend: { day: string; orders: number; revenue: string }[];
	topTitles: {
		bookId: string | null;
		title: string;
		units: number;
		revenue: string;
	}[];
	catalog: {
		books: { total: number; addedSince: number; outOfStock: number };
		authors: { total: number; addedSince: number };
	};
	customers: { total: number; joinedSince: number };
};

export type ReportResponse = { status: "success"; report: OverviewReport };

export type ConsoleReview = {
	id: string;
	rating: number;
	comment: string | null;
	createdAt: string;
	book: { id: string; title: string; coverUrl: string | null };
	user: { id: string; name: string; email: string };
};

export type ConsoleReviewsResponse = {
	status: "success";
	pagination: Pagination;
	reviews: ConsoleReview[];
};
