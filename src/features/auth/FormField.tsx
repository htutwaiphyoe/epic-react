type Props = {
	label: string;
	name: string;
	type?: "text" | "email" | "password";
	value: string;
	errors: unknown[];
	autoComplete?: string;
	onChange: (value: string) => void;
	onBlur: () => void;
};

const firstMessage = (errors: unknown[]): string | undefined => {
	for (const error of errors) {
		if (typeof error === "string" && error.length > 0) {
			return error;
		}

		if (
			typeof error === "object" &&
			error !== null &&
			"message" in error &&
			typeof (error as { message: unknown }).message === "string"
		) {
			return (error as { message: string }).message;
		}
	}

	return undefined;
};

export const FormField = ({
	label,
	name,
	type = "text",
	value,
	errors,
	autoComplete,
	onChange,
	onBlur,
}: Props) => {
	const message = firstMessage(errors);

	return (
		<div className="flex flex-col gap-2">
			<label
				htmlFor={name}
				className="text-muted-foreground text-xs uppercase tracking-[0.14em]"
			>
				{label}
			</label>

			<input
				id={name}
				name={name}
				type={type}
				value={value}
				autoComplete={autoComplete}
				aria-invalid={message ? true : undefined}
				onChange={(event) => onChange(event.target.value)}
				onBlur={onBlur}
				className="rounded-sm border bg-card px-3.5 py-2.5 text-[15px] transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring aria-invalid:border-destructive/60"
			/>

			{message ? (
				<p className="text-destructive text-[13px]">{message}</p>
			) : null}
		</div>
	);
};
