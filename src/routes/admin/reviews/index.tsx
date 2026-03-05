import {
	createFileRoute,
	Link,
	redirect,
	useRouter,
} from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { BookCover } from "@/features/books/BookCover";
import { Stars } from "@/features/reviews/Stars";
import { Pagination } from "@/features/shared/Pagination";
import type { SortOption } from "@/features/shared/SortSelect";
import { SortSelect } from "@/features/shared/SortSelect";
import {
	type ConsoleReviewsSearch,
	consoleReviewsSearchSchema,
} from "@/schemas/catalog";
import { deleteReviewFn, getConsoleReviewsFn } from "@/server/reviews";

const SORT_OPTIONS: readonly SortOption<ConsoleReviewsSearch["sortBy"]>[] = [
	{ value: "createdAt", label: "Newest" },
	{ value: "rating", label: "Rating" },
];

const RATINGS = [5, 4, 3, 2, 1] as const;

export const Route = createFileRoute("/admin/reviews/")({
	validateSearch: consoleReviewsSearchSchema,
	beforeLoad: ({ context }) => {
		if (context.user?.role !== "admin") {
			throw redirect({ to: "/admin" });
		}
	},
	loaderDeps: ({ search }) => search,
	loader: ({ deps }) => getConsoleReviewsFn({ data: deps }),
	component: AdminReviewsPage,
});

const formatDate = (value: string) =>
	new Date(value).toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});

function AdminReviewsPage() {
	const { reviews, pagination } = Route.useLoaderData();
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const router = useRouter();

	const [pendingId, setPendingId] = useState<string>();
	const [error, setError] = useState<string>();

	const remove = async (id: string, title: string) => {
		if (!window.confirm(`Delete this review of “${title}”?`)) {
			return;
		}

		setError(undefined);
		setPendingId(id);
		try {
			await deleteReviewFn({ data: { reviewId: id } });
			await router.invalidate();
		} catch (cause) {
			setError(
				cause instanceof Error ? cause.message : "Could not delete the review.",
			);
		} finally {
			setPendingId(undefined);
		}
	};

	const setRating = (rating?: number) =>
		navigate({ search: (prev) => ({ ...prev, rating, page: 1 }) });

	return (
		<>
			<header>
				<p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
					{pagination.total} {pagination.total === 1 ? "review" : "reviews"}
					{search.rating ? ` · ${search.rating} star` : ""}
				</p>
				<h1 className="mt-3 text-4xl leading-[1.1]">Reviews</h1>
			</header>

			<div className="mt-7 flex flex-wrap items-center justify-between gap-4">
				<div className="flex flex-wrap gap-2">
					<button
						type="button"
						onClick={() => setRating(undefined)}
						className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors hover:bg-muted ${
							search.rating ? "text-muted-foreground" : "bg-muted"
						}`}
					>
						All
					</button>

					{RATINGS.map((rating) => (
						<button
							key={rating}
							type="button"
							onClick={() => setRating(rating)}
							className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors hover:bg-muted ${
								search.rating === rating ? "bg-muted" : "text-muted-foreground"
							}`}
						>
							{rating}
							<Stars rating={rating} size={11} />
						</button>
					))}
				</div>

				<SortSelect
					options={SORT_OPTIONS}
					sortBy={search.sortBy}
					orderBy={search.orderBy}
					onChange={(next) =>
						navigate({ search: (prev) => ({ ...prev, ...next, page: 1 }) })
					}
				/>
			</div>

			{error && (
				<p
					role="alert"
					className="mt-6 rounded-sm border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-[14px] text-destructive"
				>
					{error}
				</p>
			)}

			{reviews.length === 0 ? (
				<div className="mt-8 rounded-sm border border-dashed py-16 text-center">
					<p className="font-serif text-lg">No reviews here</p>
				</div>
			) : (
				<div className="mt-6 divide-y border-t border-b">
					{reviews.map((review) => (
						<div key={review.id} className="flex gap-4 py-5">
							<Link
								to="/books/$bookId"
								params={{ bookId: review.book.id }}
								className="w-10 shrink-0 self-start overflow-hidden rounded-sm ring-1 ring-black/10"
							>
								<BookCover
									title={review.book.title}
									seed={review.book.id}
									coverUrl={review.book.coverUrl}
								/>
							</Link>

							<div className="min-w-0 flex-1">
								<div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
									<Stars rating={review.rating} />
									<Link
										to="/books/$bookId"
										params={{ bookId: review.book.id }}
										className="min-w-0 truncate font-medium underline-offset-2 hover:underline"
									>
										{review.book.title}
									</Link>
								</div>

								<p className="mt-1.5 text-muted-foreground text-sm">
									{review.user.name} · {review.user.email} ·{" "}
									{formatDate(review.createdAt)}
								</p>

								{review.comment && (
									<p className="mt-2 text-[15px] leading-relaxed">
										{review.comment}
									</p>
								)}
							</div>

							<button
								type="button"
								disabled={pendingId === review.id}
								aria-label={`Delete the review of ${review.book.title}`}
								onClick={() => remove(review.id, review.book.title)}
								className="inline-flex h-9 shrink-0 items-center gap-2 self-start rounded-sm border px-3 text-sm transition-colors hover:border-destructive/40 hover:text-destructive disabled:opacity-50"
							>
								<Trash2 className="size-3.5" strokeWidth={1.75} />
								{pendingId === review.id ? "Deleting…" : "Delete"}
							</button>
						</div>
					))}
				</div>
			)}

			<Pagination pagination={pagination} noun="review" />
		</>
	);
}
