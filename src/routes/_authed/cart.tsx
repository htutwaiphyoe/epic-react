import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowRight, Trash2, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import {
	type AddressDraft,
	AddressForm,
	EMPTY_ADDRESS,
} from "@/features/cart/AddressForm";
import { CartLineRow } from "@/features/cart/CartLineRow";
import { formatMoney, sumMoney } from "@/lib/money";
import {
	type AddressForm as AddressValues,
	addressSchema,
} from "@/schemas/cart";
import {
	checkoutFn,
	clearCartFn,
	getCartFn,
	removeCartItemFn,
	updateCartItemFn,
} from "@/server/cart";
import type { Cart } from "@/server/types";

export const Route = createFileRoute("/_authed/cart")({
	loader: () => getCartFn(),
	component: CartPage,
});

function CartPage() {
	const loaded = Route.useLoaderData();
	const router = useRouter();

	const [cart, setCart] = useState<Cart>(loaded);

	useEffect(() => {
		setCart(loaded);
	}, [loaded]);

	const syncBadge = () => {
		void router.invalidate();
	};

	const [address, setAddress] = useState<AddressDraft>(EMPTY_ADDRESS);
	const [addressErrors, setAddressErrors] = useState<
		Partial<Record<keyof AddressValues, string>>
	>({});
	const [deselected, setDeselected] = useState<Set<string>>(new Set());
	const [pendingId, setPendingId] = useState<string>();
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string>();

	const setField = (key: keyof AddressDraft, value: string) => {
		setAddress((current) => ({ ...current, [key]: value }));

		setAddressErrors((current) => {
			if (!current[key]) {
				return current;
			}

			const next = { ...current };
			delete next[key];

			if (Object.keys(next).length === 0) {
				setError(undefined);
			}

			return next;
		});
	};

	const isSelected = (id: string) => !deselected.has(id);

	const selectable = cart.items.filter((line) => line.available);
	const selected = selectable.filter((line) => isSelected(line.id));

	const selectedTotal = sumMoney(selected.map((line) => line.amount));

	const run = async (work: () => Promise<Cart>, lineId?: string) => {
		setError(undefined);
		setBusy(true);
		setPendingId(lineId);
		try {
			setCart(await work());
			syncBadge();
		} catch (cause) {
			setError(
				cause instanceof Error ? cause.message : "Something went wrong.",
			);
		} finally {
			setBusy(false);
			setPendingId(undefined);
		}
	};

	const toggle = (id: string, next: boolean) =>
		setDeselected((current) => {
			const updated = new Set(current);
			if (next) {
				updated.delete(id);
			} else {
				updated.add(id);
			}
			return updated;
		});

	const checkout = async () => {
		setError(undefined);

		const parsed = addressSchema.safeParse(address);

		if (!parsed.success) {
			const next: Partial<Record<keyof AddressValues, string>> = {};
			for (const issue of parsed.error.issues) {
				const key = issue.path[0] as keyof AddressValues;
				next[key] ??= issue.message;
			}
			setAddressErrors(next);
			setError("Add a delivery address to place your order.");
			return;
		}

		setAddressErrors({});
		setBusy(true);
		try {
			const order = await checkoutFn({
				data: {
					address: parsed.data,
					...(selected.length === selectable.length
						? {}
						: { itemIds: selected.map((line) => line.id) }),
				},
			});

			await router.invalidate();
			router.navigate({
				to: "/account/orders/$orderId",
				params: { orderId: order.id },
			});
		} catch (cause) {
			setError(
				cause instanceof Error ? cause.message : "Could not place the order.",
			);
			setBusy(false);
		}
	};

	if (cart.items.length === 0) {
		return (
			<div className="mx-auto max-w-2xl">
				<h1 className="text-4xl">Cart</h1>

				<div className="mt-10 rounded-sm border border-dashed py-20 text-center">
					<p className="font-serif text-lg">Your cart is empty</p>
					<Link
						to="/books"
						className="mt-4 inline-block text-sm underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
					>
						Browse the catalog
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-5xl pb-16">
			<header>
				<p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
					{cart.itemCount} {cart.itemCount === 1 ? "book" : "books"} ready
				</p>
				<h1 className="mt-3 text-4xl leading-[1.1]">Your cart.</h1>
			</header>

			{error ? (
				<p
					role="alert"
					className="mt-8 rounded-sm border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-[14px] text-destructive"
				>
					{error}
				</p>
			) : null}

			{cart.hasUnavailableItems ? (
				<p className="mt-8 flex items-start gap-2.5 rounded-sm border bg-card px-3.5 py-3 text-[14px]">
					<TriangleAlert
						className="mt-0.5 size-4 shrink-0 text-muted-foreground"
						strokeWidth={1.75}
					/>
					Some books cannot be ordered right now. Deselect them, or lower the
					quantity, and check out the rest.
				</p>
			) : null}

			<div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
				<div className="min-w-0">
					<div className="divide-y border-t border-b">
						{cart.items.map((line) => (
							<CartLineRow
								key={line.id}
								line={line}
								selected={line.available && isSelected(line.id)}
								pending={busy && pendingId === line.id}
								onSelect={(next) => toggle(line.id, next)}
								onQuantity={(quantity) =>
									run(
										() =>
											updateCartItemFn({ data: { itemId: line.id, quantity } }),
										line.id,
									)
								}
								onRemove={() =>
									run(
										() => removeCartItemFn({ data: { itemId: line.id } }),
										line.id,
									)
								}
							/>
						))}
					</div>

					<section className="mt-12">
						<h2 className="text-2xl">Delivery</h2>
						<p className="mt-2 text-muted-foreground text-sm">
							We keep a copy of this address with the order.
						</p>

						<div className="mt-6">
							<AddressForm
								values={address}
								errors={addressErrors}
								disabled={busy}
								onChange={setField}
							/>
						</div>
					</section>
				</div>

				<aside className="rounded-sm border bg-card p-6 lg:sticky lg:top-24">
					<p className="text-muted-foreground text-xs uppercase tracking-[0.14em]">
						Subtotal
					</p>

					<p
						data-testid="cart-subtotal"
						className="mt-2 font-serif text-3xl tabular-nums"
					>
						{formatMoney(
							selected.length === selectable.length
								? cart.subtotal
								: selectedTotal,
						)}
					</p>

					<p className="mt-2 text-muted-foreground text-sm">
						{selected.length === selectable.length
							? `All ${selectable.length} ${selectable.length === 1 ? "book" : "books"}`
							: `${selected.length} of ${selectable.length} selected`}
					</p>

					<button
						type="button"
						disabled={busy || selected.length === 0}
						onClick={checkout}
						className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-sm bg-primary px-6 py-3 font-medium text-primary-foreground text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
					>
						{busy ? "Working…" : "Place order"}
						{busy ? null : <ArrowRight className="size-4" strokeWidth={1.75} />}
					</button>

					<p className="mt-3 text-center text-muted-foreground text-xs">
						Payment is not collected yet — orders start as pending.
					</p>

					<button
						type="button"
						disabled={busy}
						onClick={() => run(() => clearCartFn())}
						className="mt-6 inline-flex w-full items-center justify-center gap-2 text-muted-foreground text-sm transition-colors hover:text-destructive disabled:opacity-50"
					>
						<Trash2 className="size-3.5" strokeWidth={1.75} />
						Clear cart
					</button>
				</aside>
			</div>
		</div>
	);
}
