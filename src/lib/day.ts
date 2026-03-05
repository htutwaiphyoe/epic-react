export const toDay = (value: string) => {
	const [year, month, day] = value.split("-");

	return new Date(Number(year), Number(month) - 1, Number(day));
};

export const toValue = (date: Date) =>
	[
		date.getFullYear(),
		String(date.getMonth() + 1).padStart(2, "0"),
		String(date.getDate()).padStart(2, "0"),
	].join("-");

export const formatDay = (value: string) =>
	toDay(value).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});

export const startOfMonth = (date: Date) =>
	new Date(date.getFullYear(), date.getMonth(), 1);

export const isDay = (value: string) =>
	/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(toDay(value).getTime());
