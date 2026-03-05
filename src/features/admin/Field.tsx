import type { ReactNode } from "react";

type Props = {
	label: string;
	name: string;
	error?: string;
	hint?: string;
	children: ReactNode;
};

export const inputClass =
	"w-full rounded-sm border bg-card px-3.5 py-2.5 text-[15px] transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring aria-invalid:border-destructive/60";

export const Field = ({ label, name, error, hint, children }: Props) => (
	<div className="flex flex-col gap-2">
		<div className="flex flex-wrap items-baseline justify-between gap-x-3">
			<label
				htmlFor={name}
				className="text-muted-foreground text-xs uppercase tracking-[0.14em]"
			>
				{label}
			</label>

			{hint && <span className="text-muted-foreground/70 text-xs">{hint}</span>}
		</div>

		{children}

		{error && <p className="text-destructive text-[13px]">{error}</p>}
	</div>
);
