import { MAX_CART_QUANTITY } from "@/schemas/cart";

type Props = {
	quantity: number;
	max: number;
	pending: boolean;
	onChange: (quantity: number) => void;
};

const button =
	"flex h-8 w-8 items-center justify-center rounded-sm border text-base leading-none transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40";

export const QuantityStepper = ({
	quantity,
	max,
	pending,
	onChange,
}: Props) => {
	const ceiling = Math.min(max, MAX_CART_QUANTITY);

	return (
		<div className="flex items-center gap-2">
			<button
				type="button"
				aria-label="Decrease quantity"
				disabled={pending || quantity <= 1}
				onClick={() => onChange(quantity - 1)}
				className={button}
			>
				−
			</button>

			<span aria-live="polite" className="w-8 text-center text-sm tabular-nums">
				{quantity}
			</span>

			<button
				type="button"
				aria-label="Increase quantity"
				disabled={pending || quantity >= ceiling}
				onClick={() => onChange(quantity + 1)}
				className={button}
			>
				+
			</button>
		</div>
	);
};
