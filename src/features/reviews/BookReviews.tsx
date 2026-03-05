import { Link, useRouter } from "@tanstack/react-router";
import { Pencil, PenLine, Trash2 } from "lucide-react";
import { useState } from "react";
import {
	createReviewFn,
	deleteReviewFn,
	updateReviewFn,
} from "@/server/reviews";
import type { Review, ReviewEligibility } from "@/server/types";
import { ReviewForm } from "./ReviewForm";
import { Stars } from "./Stars";

type Props = {
	bookId: string;
	reviews: Review[];
	total: number;
	currentUserId: string | null;
	canReview: boolean;
	eligibility: ReviewEligibility | null;
};

const formatDate = (value: string) =>
	new Date(value).toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});

export const BookReviews = ({
	bookId,
	reviews,
	total,
	currentUserId,
	canReview,
	eligibility,
}: Props) => {
	const router = useRouter();
	const [editing, setEditing] = useState(false);
	const [writing, setWriting] = useState(false);
	const [error, setError] = useState<string>();

	const mine = currentUserId
		? reviews.find((review) => review.user.id === currentUserId)
		: undefined;

	const others = mine
		? reviews.filter((review) => review.id !== mine.id)
		: reviews;

	const remove = async () => {
		setError(undefined);
		try {
			await deleteReviewFn({ data: { reviewId: mine?.id ?? "" } });
			await router.invalidate();
		} catch (cause) {
			setError(
				cause instanceof Error ? cause.message : "Could not delete the review.",
			);
		}
	};

	return (
		<section className="rule-above mt-14 pt-10">
			<div className="flex items-baseline justify-between gap-4">
				<h2 className="text-2xl">
					{total === 0
						? "No reviews yet"
						: `${total} ${total === 1 ? "review" : "reviews"}`}
				</h2>

				{canReview && currentUserId && eligibility?.canReview && !writing ? (
					<button
						type="button"
						onClick={() => setWriting(true)}
						className="inline-flex items-center gap-2 rounded-sm border px-4 py-2 text-sm transition-colors hover:bg-muted"
					>
						<PenLine className="size-4" strokeWidth={1.75} />
						Write a review
					</button>
				) : null}

				{canReview && !currentUserId && (
					<Link
						to="/login"
						search={{ redirect: `/books/${bookId}` }}
						className="text-muted-foreground text-sm underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
					>
						Sign in to review
					</Link>
				)}
			</div>

			{error ? (
				<p role="alert" className="mt-4 text-destructive text-sm">
					{error}
				</p>
			) : null}

			{writing ? (
				<div className="mt-6">
					<ReviewForm
						submitLabel="Post review"
						onSubmit={async (values) => {
							await createReviewFn({ data: { bookId, ...values } });
							setWriting(false);
							await router.invalidate();
						}}
						onCancel={() => setWriting(false)}
					/>
				</div>
			) : null}

			{mine ? (
				<div className="mt-6">
					{editing ? (
						<ReviewForm
							initialRating={mine.rating}
							initialComment={mine.comment ?? ""}
							submitLabel="Save changes"
							onSubmit={async (values) => {
								await updateReviewFn({
									data: { reviewId: mine.id, ...values },
								});
								setEditing(false);
								await router.invalidate();
							}}
							onCancel={() => setEditing(false)}
						/>
					) : (
						<article className="rounded-sm border bg-card p-5">
							<div className="flex items-center justify-between gap-4">
								<div className="flex items-center gap-3">
									<Stars rating={mine.rating} />
									<span className="text-muted-foreground text-xs uppercase tracking-[0.14em]">
										Your review
									</span>
								</div>

								<div className="flex items-center gap-3 text-sm">
									<button
										type="button"
										onClick={() => setEditing(true)}
										className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
									>
										<Pencil className="size-3.5" strokeWidth={1.75} />
										Edit
									</button>
									<button
										type="button"
										onClick={remove}
										className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-destructive"
									>
										<Trash2 className="size-3.5" strokeWidth={1.75} />
										Delete
									</button>
								</div>
							</div>

							{mine.comment ? (
								<p className="mt-3 text-[15px] leading-relaxed">
									{mine.comment}
								</p>
							) : null}
						</article>
					)}
				</div>
			) : null}

			{others.length > 0 ? (
				<div className="mt-8 divide-y border-t">
					{others.map((review) => (
						<article key={review.id} className="py-6">
							<div className="flex items-center gap-3">
								<Stars rating={review.rating} />
								<span className="font-medium text-sm">{review.user.name}</span>
								<span className="text-muted-foreground text-sm">
									{formatDate(review.createdAt)}
								</span>
							</div>

							{review.comment ? (
								<p className="mt-2.5 text-[15px] leading-relaxed">
									{review.comment}
								</p>
							) : null}
						</article>
					))}
				</div>
			) : null}

			{canReview && total === 0 && !writing && !mine ? (
				<p className="mt-4 text-muted-foreground">
					Be the first to review this book — you can review anything you have
					ordered.
				</p>
			) : null}
		</section>
	);
};
