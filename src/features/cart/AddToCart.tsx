import { Link, useRouter } from "@tanstack/react-router";
import { Check, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { addCartItemFn } from "@/server/cart";

type Props = {
	bookId: string;
	stock: number;
	signedIn: boolean;
	canShop: boolean;
	inCart: boolean;
};

const solid =
	"inline-flex items-center gap-2 rounded-sm bg-primary px-6 py-3 font-medium text-primary-foreground text-sm transition-opacity hover:opacity-90 disabled:opacity-60";
const outline =
	"inline-flex items-center gap-2 rounded-sm border px-6 py-3 font-medium text-sm transition-colors hover:bg-muted";

export const AddToCart = ({
	bookId,
	stock,
	signedIn,
	canShop,
	inCart,
}: Props) => {
	const router = useRouter();
	const [error, setError] = useState<string>();
	const [busy, setBusy] = useState(false);

	if (!canShop) {
		return null;
	}

	if (stock === 0) {
		return (
			<p className="mt-8 rounded-sm border bg-card px-4 py-3 text-[15px]">
				Out of stock — check back soon.
			</p>
		);
	}

	if (inCart) {
		return (
			<div className="mt-8">
				<Link to="/cart" className={outline}>
					<Check className="size-4" strokeWidth={2} />
					View in cart
				</Link>
			</div>
		);
	}

	const add = async () => {
		if (!signedIn) {
			router.navigate({
				to: "/login",
				search: { redirect: `/books/${bookId}` },
			});
			return;
		}

		setError(undefined);
		setBusy(true);
		try {
			await addCartItemFn({ data: { bookId, quantity: 1 } });
			await router.invalidate();
		} catch (cause) {
			setError(
				cause instanceof Error ? cause.message : "Could not add to your cart.",
			);
		} finally {
			setBusy(false);
		}
	};

	return (
		<div className="mt-8">
			<button type="button" disabled={busy} onClick={add} className={solid}>
				<ShoppingBag className="size-4" strokeWidth={1.75} />
				{busy ? "Adding…" : "Add to cart"}
			</button>

			{error ? (
				<p role="alert" className="mt-3 text-destructive text-sm">
					{error}
				</p>
			) : null}
		</div>
	);
};
