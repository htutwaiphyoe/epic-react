const toCents = (amount: string): number => {
	const [whole = "0", fraction = ""] = amount.split(".");
	const paddedFraction = fraction.padEnd(2, "0").slice(0, 2);
	return Number(whole) * 100 + Number(paddedFraction);
};

const fromCents = (cents: number): string =>
	`${Math.trunc(cents / 100)}.${String(Math.abs(cents) % 100).padStart(2, "0")}`;

export const formatMoney = (amount: string, currency = "USD"): string =>
	new Intl.NumberFormat("en-US", {
		style: "currency",
		currency,
	}).format(toCents(amount) / 100);

export const multiplyMoney = (amount: string, quantity: number): string =>
	fromCents(toCents(amount) * quantity);

export const sumMoney = (amounts: string[]): string =>
	fromCents(amounts.reduce((total, amount) => total + toCents(amount), 0));

export const formatRating = (average: string, count?: number): string =>
	count === 0 ? "—" : (toCents(average) / 100).toFixed(1);
