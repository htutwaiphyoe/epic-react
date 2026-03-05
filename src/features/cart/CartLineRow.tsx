import { Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { BookCover } from "@/features/books/BookCover";
import { formatMoney } from "@/lib/money";
import type { CartLine } from "@/server/types";
import { QuantityStepper } from "./QuantityStepper";

type Props = {
	line: CartLine;
	selected: boolean;
	pending: boolean;
	onSelect: (selected: boolean) => void;
	onQuantity: (quantity: number) => void;
	onRemove: () => void;
};

export const CartLineRow = ({
	line,
	selected,
	pending,
	onSelect,
	onQuantity,
	onRemove,
}: Props) => (
	<div
		data-testid="cart-line"
		className={`flex gap-5 py-6 ${pending ? "opacity-60" : ""}`}
	>
		<input
			type="checkbox"
			checked={selected}
			disabled={!line.available}
			aria-label={`Select ${line.title}`}
			onChange={(event) => onSelect(event.target.checked)}
			className="mt-1 size-4 shrink-0 accent-primary"
		/>

		<Link
			to="/books/$bookId"
			params={{ bookId: line.bookId }}
			className="w-16 shrink-0 self-start overflow-hidden rounded-sm ring-1 ring-black/5"
		>
			<BookCover
				title={line.title}
				seed={line.bookId}
				coverUrl={line.coverUrl}
			/>
		</Link>

		<div className="min-w-0 flex-1">
			<Link
				to="/books/$bookId"
				params={{ bookId: line.bookId }}
				className="font-medium text-[15px] leading-snug underline-offset-2 hover:underline"
			>
				{line.title}
			</Link>

			<p className="mt-1 text-muted-foreground text-sm tabular-nums">
				{formatMoney(line.price)} each
			</p>

			{line.available ? null : (
				<p className="mt-1 text-destructive text-sm">
					{line.stock === 0
						? "Out of stock"
						: `Only ${line.stock} left — reduce the quantity to check out`}
				</p>
			)}

			<div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
				<QuantityStepper
					quantity={line.quantity}
					max={Math.max(line.stock, line.quantity)}
					pending={pending}
					onChange={onQuantity}
				/>

				<button
					type="button"
					disabled={pending}
					onClick={onRemove}
					className="inline-flex items-center gap-1.5 text-muted-foreground text-sm transition-colors hover:text-destructive disabled:opacity-50"
				>
					<Trash2 className="size-3.5" strokeWidth={1.75} />
					Remove
				</button>
			</div>
		</div>

		<p className="w-16 shrink-0 self-start text-right font-medium tabular-nums sm:w-20">
			{formatMoney(line.amount)}
		</p>
	</div>
);
