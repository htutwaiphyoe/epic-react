import { Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";

type Props = {
	submitLabel: string;
	pending: boolean;
	cancelTo: "/admin/books" | "/admin/authors";
	onDelete?: () => void;
	deleting?: boolean;
};

export const FormActions = ({
	submitLabel,
	pending,
	cancelTo,
	onDelete,
	deleting,
}: Props) => (
	<div className="rule-above mt-9 flex flex-wrap items-center gap-4 pt-6">
		<button
			type="submit"
			disabled={pending}
			className="rounded-sm bg-primary px-5 py-2.5 font-medium text-primary-foreground text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
		>
			{pending ? "Saving…" : submitLabel}
		</button>

		<Link
			to={cancelTo}
			className="text-muted-foreground text-sm transition-colors hover:text-foreground"
		>
			Cancel
		</Link>

		{onDelete ? (
			<button
				type="button"
				disabled={deleting}
				onClick={onDelete}
				className="ml-auto inline-flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-destructive disabled:opacity-50"
			>
				<Trash2 className="size-3.5" strokeWidth={1.75} />
				{deleting ? "Deleting…" : "Delete"}
			</button>
		) : null}
	</div>
);
