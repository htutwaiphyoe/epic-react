type Props = {
	label: string;
	pendingLabel: string;
	pending: boolean;
};

export const SubmitButton = ({ label, pendingLabel, pending }: Props) => (
	<button
		type="submit"
		disabled={pending}
		className="mt-2 rounded-sm bg-primary px-5 py-3 font-medium text-primary-foreground text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
	>
		{pending ? pendingLabel : label}
	</button>
);
