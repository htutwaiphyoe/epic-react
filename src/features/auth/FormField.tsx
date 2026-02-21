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
		<div className="flex flex-col gap-1.5">
			<label htmlFor={name} className="font-medium text-sm">
				{label}
			</label>

			<input
				id={name}
				name={name}
				type={type}
				value={value}
				autoComplete={autoComplete}
				onChange={(event) => onChange(event.target.value)}
				onBlur={onBlur}
				className="rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
			/>

			{message ? <p className="text-destructive text-sm">{message}</p> : null}
		</div>
	);
};
