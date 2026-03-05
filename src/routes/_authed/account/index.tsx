import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
	Cake,
	CalendarDays,
	ChevronRight,
	LogOut,
	Mail,
	Package,
	Pencil,
	ShoppingBag,
	SlidersHorizontal,
} from "lucide-react";
import { useState } from "react";
import { ProfileEditor } from "@/features/auth/ProfileEditor";
import { toDay } from "@/lib/day";
import { formatMoney, sumMoney } from "@/lib/money";
import { getProfileFn, logoutFn, updateProfileFn } from "@/server/auth";
import { getOrdersFn } from "@/server/orders";

export const Route = createFileRoute("/_authed/account/")({
	loader: async () => {
		const user = await getProfileFn();

		if (user.role === "admin") {
			return { user, stats: null };
		}

		const orders = await getOrdersFn({
			data: { page: 1, limit: 100, sortBy: "createdAt", orderBy: "desc" },
		});

		const live = orders.orders.filter((order) => order.status !== "cancelled");

		return {
			user,
			stats: {
				orders: live.length,
				books: live.reduce(
					(sum, order) =>
						sum + order.items.reduce((n, item) => n + item.quantity, 0),
					0,
				),
				spent: sumMoney(live.map((order) => order.total)),
			},
		};
	},
	component: AccountPage,
});

const ROLE_LABELS: Record<string, string> = {
	user: "Reader",
	publisher: "Publisher",
	admin: "Administrator",
};

const formatJoined = (value: string) =>
	new Date(value).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
	});

const formatBirthday = (value: string) =>
	toDay(value).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});

function AccountPage() {
	const router = useRouter();
	const { user, stats } = Route.useLoaderData();
	const [editing, setEditing] = useState(false);

	const meta = [
		{ icon: Mail, value: user.email },
		...(user.dob ? [{ icon: Cake, value: formatBirthday(user.dob) }] : []),
		{ icon: CalendarDays, value: `Joined ${formatJoined(user.createdAt)}` },
	];

	const links = [
		...(user.role !== "admin"
			? [
					{
						to: "/account/orders" as const,
						search: {
							page: 1,
							limit: 20,
							sortBy: "createdAt" as const,
							orderBy: "desc" as const,
						},
						label: "Your orders",
						hint: "Track deliveries and cancel what is still pending",
						icon: Package,
					},
					{
						to: "/cart" as const,
						search: undefined,
						label: "Cart",
						hint: "Finish what you started",
						icon: ShoppingBag,
					},
				]
			: []),
		...(user.role !== "user"
			? [
					{
						to: "/admin" as const,
						search: undefined,
						label: "Console",
						hint: "Manage the catalog of books and authors",
						icon: SlidersHorizontal,
					},
				]
			: []),
		...(user.role === "admin"
			? [
					{
						to: "/admin/orders" as const,
						search: {
							page: 1,
							limit: 20,
							sortBy: "createdAt" as const,
							orderBy: "desc" as const,
						},
						label: "Customer orders",
						hint: "Take payment, mark shipped, review the report",
						icon: Package,
					},
				]
			: []),
	];

	return (
		<div className="mx-auto max-w-3xl pb-16">
			<section className="relative overflow-hidden rounded-sm border bg-card">
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-linear-to-b from-muted to-transparent"
				/>

				<div className="relative flex flex-wrap items-start gap-x-6 gap-y-5 px-6 py-7 sm:px-8">
					{user.profileUrl ? (
						<img
							src={user.profileUrl}
							alt={user.name}
							className="size-22 shrink-0 self-start rounded-full object-cover object-top ring-4 ring-card"
						/>
					) : (
						<span className="grid size-22 shrink-0 self-start place-items-center rounded-full bg-primary font-serif text-3xl text-primary-foreground ring-4 ring-card">
							{user.name.slice(0, 1).toUpperCase()}
						</span>
					)}

					<div className="min-w-0 flex-1">
						<div className="flex flex-wrap items-center gap-x-3 gap-y-2">
							<h1 className="min-w-0 truncate text-4xl leading-[1.1]">
								{user.name}
							</h1>
							<span className="rounded-full border bg-background px-2.5 py-1 text-[11px] text-muted-foreground uppercase tracking-[0.14em]">
								{ROLE_LABELS[user.role] ?? user.role}
							</span>
						</div>

						<dl className="mt-5 flex flex-wrap gap-x-7 gap-y-2.5">
							{meta.map((item) => (
								<div
									key={item.value}
									className="flex min-w-0 items-center gap-2 text-[15px]"
								>
									<dt className="shrink-0">
										<item.icon
											className="size-4 text-muted-foreground"
											strokeWidth={1.75}
										/>
									</dt>
									<dd className="truncate text-muted-foreground">
										{item.value}
									</dd>
								</div>
							))}
						</dl>
					</div>

					{editing ? null : (
						<button
							type="button"
							onClick={() => setEditing(true)}
							className="inline-flex shrink-0 items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm transition-colors hover:bg-muted"
						>
							<Pencil className="size-3.5" strokeWidth={1.75} />
							Edit
						</button>
					)}
				</div>
			</section>

			{editing ? (
				<ProfileEditor
					profile={user}
					onCancel={() => setEditing(false)}
					onSave={async (values) => {
						await updateProfileFn({ data: values });
						setEditing(false);
						await router.invalidate();
					}}
				/>
			) : (
				<>
					{stats && (
						<dl className="mt-4 grid gap-4 sm:grid-cols-3">
							{[
								{ label: "Orders", value: String(stats.orders) },
								{ label: "Books", value: String(stats.books) },
								{ label: "Spent", value: formatMoney(stats.spent) },
							].map((stat) => (
								<div
									key={stat.label}
									className="rounded-sm border bg-card px-5 py-4"
								>
									<dt className="text-muted-foreground text-xs uppercase tracking-[0.14em]">
										{stat.label}
									</dt>
									<dd className="mt-2 font-serif text-2xl tabular-nums">
										{stat.value}
									</dd>
								</div>
							))}
						</dl>
					)}

					<nav className="mt-4 grid gap-4 sm:grid-cols-2">
						{links.map((link) => (
							<Link
								key={link.label}
								to={link.to}
								search={link.search}
								className="group flex items-start gap-4 rounded-sm border bg-card px-5 py-5 transition-colors hover:bg-muted/50"
							>
								<span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted transition-colors group-hover:bg-background">
									<link.icon
										className="size-4.5 text-muted-foreground"
										strokeWidth={1.75}
									/>
								</span>

								<span className="min-w-0 flex-1">
									<span className="flex items-center gap-1">
										<span className="font-medium">{link.label}</span>
										<ChevronRight
											className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5"
											strokeWidth={2}
										/>
									</span>
									<span className="mt-1 block text-muted-foreground text-sm leading-snug">
										{link.hint}
									</span>
								</span>
							</Link>
						))}
					</nav>

					<div className="rule-above mt-10 flex flex-wrap items-center justify-between gap-3 pt-6">
						<p className="text-muted-foreground text-sm">
							Your password is changed through the reset link.
						</p>

						<button
							type="button"
							onClick={async () => {
								await logoutFn();
								await router.invalidate();
								router.navigate({ to: "/" });
							}}
							className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors hover:border-destructive/40 hover:text-destructive"
						>
							<LogOut className="size-4" strokeWidth={1.75} />
							Sign out
						</button>
					</div>
				</>
			)}
		</div>
	);
}
