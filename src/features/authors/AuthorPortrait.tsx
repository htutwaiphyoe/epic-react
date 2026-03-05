const initials = (name: string) =>
	name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? "")
		.join("");

type Props = {
	name: string;
	photoUrl?: string | null;
	size?: "grid" | "detail";
};

export const AuthorPortrait = ({ name, photoUrl, size = "grid" }: Props) => {
	const isDetail = size === "detail";

	if (photoUrl) {
		return (
			<img
				src={photoUrl}
				alt={name}
				loading={isDetail ? "eager" : "lazy"}
				decoding="async"
				className="aspect-square w-full bg-muted object-cover object-top grayscale-[15%]"
			/>
		);
	}

	return (
		<div className="flex aspect-square w-full items-center justify-center bg-muted">
			<span
				className={`font-serif text-muted-foreground ${
					isDetail ? "text-5xl" : "text-2xl"
				}`}
			>
				{initials(name)}
			</span>
		</div>
	);
};
