import { Link } from "@tanstack/react-router";
import { BookText, ShoppingCart, SlidersHorizontal, Users } from "lucide-react";

const pill =
	"grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:flex sm:size-auto sm:px-3.5 sm:py-1.5";
const pillActive = { className: "bg-muted text-foreground" };

type Props = {
	user: { name: string; role: string } | null;
	cartCount: number;
};

export const Header = ({ user, cartCount }: Props) => (
	<header className="sticky top-4 z-30 mt-4 px-4 sm:px-6">
		<div className="mx-auto flex h-14 max-w-5xl items-center gap-0.5 rounded-full border bg-background/95 pr-2 pl-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.18)] ring-1 ring-black/2 backdrop-blur-md sm:gap-1 sm:pl-5">
			<Link
				to="/"
				className="mr-1 font-serif text-[19px] tracking-tight sm:mr-3"
				style={{ letterSpacing: "-0.02em" }}
			>
				Kawi
			</Link>

			<nav className="flex items-center gap-0.5 text-sm">
				<Link
					to="/books"
					aria-label="Books"
					className={pill}
					activeProps={pillActive}
				>
					<BookText className="size-4.5 sm:hidden" strokeWidth={1.75} />
					<span className="hidden sm:inline">Books</span>
				</Link>

				<Link
					to="/authors"
					aria-label="Authors"
					className={pill}
					activeProps={pillActive}
				>
					<Users className="size-4.5 sm:hidden" strokeWidth={1.75} />
					<span className="hidden sm:inline">Authors</span>
				</Link>

				{user && user.role !== "user" ? (
					<Link
						to="/admin"
						aria-label="Console"
						className={pill}
						activeProps={pillActive}
					>
						<SlidersHorizontal
							className="size-4.5 sm:hidden"
							strokeWidth={1.75}
						/>
						<span className="hidden sm:inline">Console</span>
					</Link>
				) : null}
			</nav>

			<div className="ml-auto flex items-center gap-0.5 text-sm sm:gap-1">
				{user && user.role !== "admin" ? (
					<Link
						to="/cart"
						aria-label={
							cartCount > 0 ? `Cart, ${cartCount} items` : "Cart, empty"
						}
						className="relative grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						activeProps={pillActive}
					>
						<ShoppingCart className="size-4.5" strokeWidth={1.75} />

						{cartCount > 0 ? (
							<span
								data-testid="cart-count"
								className="absolute top-0.5 right-0.5 grid size-4.25 place-items-center rounded-full bg-primary font-medium text-[10px] text-primary-foreground tabular-nums"
							>
								{cartCount > 9 ? "9+" : cartCount}
							</span>
						) : null}
					</Link>
				) : null}

				{user ? (
					<Link
						to="/account"
						aria-label="Account"
						className="flex shrink-0 items-center gap-2 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:pr-3.5"
						activeProps={pillActive}
					>
						<span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary font-medium text-[11px] text-primary-foreground">
							{user.name.slice(0, 1).toUpperCase()}
						</span>
						<span className="hidden whitespace-nowrap sm:inline">
							{user.name}
						</span>
					</Link>
				) : (
					<Link
						to="/login"
						className="whitespace-nowrap rounded-full bg-primary px-4 py-2 font-medium text-primary-foreground transition-opacity hover:opacity-90"
					>
						Sign in
					</Link>
				)}
			</div>
		</div>
	</header>
);
