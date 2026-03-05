import type { ReactNode } from "react";

type Props = {
	eyebrow: string;
	title: string;
	description?: string;
	children: ReactNode;
	footer?: ReactNode;
};

export const AuthShell = ({
	eyebrow,
	title,
	description,
	children,
	footer,
}: Props) => (
	<div className="mx-auto max-w-[27rem] pb-24">
		<p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
			{eyebrow}
		</p>

		<h1 className="mt-4 text-[2.5rem] leading-[1.08]">{title}</h1>

		{description ? (
			<p className="mt-4 text-[15px] text-muted-foreground leading-relaxed">
				{description}
			</p>
		) : null}

		<div className="mt-9">{children}</div>

		{footer ? (
			<div className="rule-above mt-10 flex flex-wrap items-center justify-between gap-3 pt-5 text-sm">
				{footer}
			</div>
		) : null}
	</div>
);
