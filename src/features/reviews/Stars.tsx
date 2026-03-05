import { Star } from "lucide-react";

type Props = {
	rating: number;
	size?: number;
};

export const Stars = ({ rating, size = 14 }: Props) => (
	<span
		role="img"
		className="inline-flex items-center gap-0.5"
		aria-label={`${rating} out of 5`}
	>
		{[1, 2, 3, 4, 5].map((value) => (
			<Star
				key={value}
				className={
					value <= rating ? "fill-current text-foreground" : "text-border"
				}
				style={{ width: size, height: size }}
				strokeWidth={1.5}
			/>
		))}
	</span>
);
