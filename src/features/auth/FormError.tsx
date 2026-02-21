export const FormError = ({ message }: { message?: string }) =>
	message ? (
		<p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive text-sm">
			{message}
		</p>
	) : null;
