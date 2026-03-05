import { Star } from "lucide-react";
import { useState } from "react";

type Props = {
	value: number;
	disabled?: boolean;
	onChange: (rating: number) => void;
};

const LABELS = ["Poor", "Fair", "Good", "Very good", "Excellent"];

export const RatingInput = ({ value, disabled, onChange }: Props) => {
	const [hovered, setHovered] = useState(0);
	const shown = hovered || value;

	return (
		<div className="flex items-center gap-3">
			<div
				role="radiogroup"
				aria-label="Rating"
				className="flex items-center gap-1"
				onMouseLeave={() => setHovered(0)}
			>
				{[1, 2, 3, 4, 5].map((rating) => (
					<label
						key={rating}
						onMouseEnter={() => setHovered(rating)}
						className="cursor-pointer rounded-sm p-0.5 transition-transform hover:scale-110"
					>
						<input
							type="radio"
							name="rating"
							value={rating}
							checked={value === rating}
							disabled={disabled}
							aria-label={`${rating} star${rating === 1 ? "" : "s"}`}
							onChange={() => onChange(rating)}
							onFocus={() => setHovered(rating)}
							onBlur={() => setHovered(0)}
							className="peer sr-only"
						/>

						<Star
							className={`size-6 rounded-sm peer-focus-visible:ring-1 peer-focus-visible:ring-ring ${
								rating <= shown ? "fill-current text-foreground" : "text-border"
							}`}
							strokeWidth={1.5}
						/>
					</label>
				))}
			</div>

			<span className="text-muted-foreground text-sm">
				{shown > 0 ? LABELS[shown - 1] : "Tap a star"}
			</span>
		</div>
	);
};
