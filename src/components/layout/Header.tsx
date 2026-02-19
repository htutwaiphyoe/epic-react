import { Link } from "@tanstack/react-router";

const navLinkClass = "transition-colors hover:text-foreground";
const activeProps = { className: "text-foreground font-medium" };

export const Header = () => (
	<header className="border-b">
		<div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-4">
			<Link to="/" className="font-semibold text-lg tracking-tight">
				Kawi
			</Link>

			<nav className="flex gap-6 text-muted-foreground text-sm">
				<Link to="/books" className={navLinkClass} activeProps={activeProps}>
					Books
				</Link>
				<Link to="/authors" className={navLinkClass} activeProps={activeProps}>
					Authors
				</Link>
			</nav>
		</div>
	</header>
);
