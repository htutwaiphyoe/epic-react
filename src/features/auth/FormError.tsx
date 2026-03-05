export const FormError = ({ message }: { message?: string }) =>
	message ? (
		<p
			role="alert"
			className="rounded-sm border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-[14px] text-destructive"
		>
			{message}
		</p>
	) : null;
