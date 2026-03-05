const PALETTE = [
	{ bg: "oklch(0.3 0.05 250)", rule: "oklch(0.66 0.1 250)" },
	{ bg: "oklch(0.3 0.07 25)", rule: "oklch(0.66 0.12 35)" },
	{ bg: "oklch(0.29 0.05 150)", rule: "oklch(0.64 0.09 150)" },
	{ bg: "oklch(0.27 0.02 60)", rule: "oklch(0.62 0.05 75)" },
	{ bg: "oklch(0.3 0.06 305)", rule: "oklch(0.66 0.1 305)" },
	{ bg: "oklch(0.29 0.05 200)", rule: "oklch(0.64 0.09 200)" },
	{ bg: "oklch(0.31 0.06 85)", rule: "oklch(0.68 0.11 85)" },
	{ bg: "oklch(0.27 0.06 5)", rule: "oklch(0.62 0.12 15)" },
];

const paletteFor = (seed: string) => {
	const hex = seed.replace(/[^0-9a-f]/gi, "").slice(-8);
	const parsed = Number.parseInt(hex, 16);
	const index = Number.isNaN(parsed) ? 0 : parsed % PALETTE.length;

	return PALETTE[index] ?? PALETTE[0];
};

type Props = {
	title: string;
	seed: string;
	coverUrl?: string | null;
	size?: "grid" | "detail";
};

export const BookCover = ({ title, seed, coverUrl, size = "grid" }: Props) => {
	const isDetail = size === "detail";

	if (coverUrl) {
		return (
			<img
				src={coverUrl}
				alt={`Cover of ${title}`}
				loading={isDetail ? "eager" : "lazy"}
				decoding="async"
				className="aspect-3/4 w-full bg-muted object-cover"
			/>
		);
	}

	const palette = paletteFor(seed);

	return (
		<div
			className={`flex aspect-3/4 flex-col overflow-hidden ${
				isDetail ? "p-7" : "p-4"
			}`}
			style={{
				backgroundColor: palette?.bg,
				boxShadow:
					"inset -1px 0 0 rgba(255,255,255,0.12), inset 4px 0 8px rgba(0,0,0,0.3)",
			}}
		>
			<div
				className={isDetail ? "w-14" : "w-9"}
				style={{ borderTop: `2px solid ${palette?.rule}` }}
			/>

			<div className="flex-1" />

			<p
				className={`font-serif text-white/95 ${
					isDetail ? "text-[26px] leading-[1.2]" : "text-[15px] leading-tight"
				}`}
			>
				{title}
			</p>

			<div
				className={`mt-3 tracking-[0.2em] text-white/40 uppercase ${
					isDetail ? "text-[11px]" : "text-[9px]"
				}`}
			>
				Kawi
			</div>
		</div>
	);
};
