import { useState } from "react";
import { RatingInput } from "./RatingInput";

type Props = {
	initialRating?: number;
	initialComment?: string;
	submitLabel: string;
	onSubmit: (values: { rating: number; comment?: string }) => Promise<void>;
	onCancel?: () => void;
};

export const ReviewForm = ({
	initialRating = 0,
	initialComment = "",
	submitLabel,
	onSubmit,
	onCancel,
}: Props) => {
	const [rating, setRating] = useState(initialRating);
	const [comment, setComment] = useState(initialComment);
	const [error, setError] = useState<string>();
	const [busy, setBusy] = useState(false);

	const submit = async (event: React.FormEvent) => {
		event.preventDefault();

		if (rating === 0) {
			setError("Pick a rating from 1 to 5.");
			return;
		}

		setError(undefined);
		setBusy(true);
		try {
			await onSubmit({ rating, comment: comment.trim() || undefined });
		} catch (cause) {
			setError(
				cause instanceof Error ? cause.message : "Could not save your review.",
			);
		} finally {
			setBusy(false);
		}
	};

	return (
		<form
			method="post"
			onSubmit={submit}
			className="rounded-sm border bg-card p-5"
		>
			<RatingInput value={rating} disabled={busy} onChange={setRating} />

			<label
				htmlFor="comment"
				className="mt-5 block text-muted-foreground text-xs uppercase tracking-[0.14em]"
			>
				Your thoughts
			</label>

			<textarea
				id="comment"
				name="comment"
				rows={4}
				maxLength={1000}
				value={comment}
				disabled={busy}
				placeholder="What did this book teach you?"
				onChange={(event) => setComment(event.target.value)}
				className="mt-2 w-full resize-y rounded-sm border bg-background px-3.5 py-3 text-[15px] transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
			/>

			<div className="mt-1 flex items-center justify-between">
				<span className="text-muted-foreground text-xs tabular-nums">
					{comment.length}/1000
				</span>
			</div>

			{error ? (
				<p role="alert" className="mt-3 text-destructive text-sm">
					{error}
				</p>
			) : null}

			<div className="mt-5 flex items-center gap-3">
				<button
					type="submit"
					disabled={busy}
					className="rounded-sm bg-primary px-5 py-2.5 font-medium text-primary-foreground text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
				>
					{busy ? "Saving…" : submitLabel}
				</button>

				{onCancel ? (
					<button
						type="button"
						disabled={busy}
						onClick={onCancel}
						className="text-muted-foreground text-sm underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
					>
						Cancel
					</button>
				) : null}
			</div>
		</form>
	);
};
