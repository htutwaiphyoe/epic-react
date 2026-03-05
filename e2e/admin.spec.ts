import { expect, type Page, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

const summary = (page: Page) => page.locator("header p").first();
const picker = (page: Page) =>
	page.locator("button[data-slot='popover-trigger']");

const orderCount = async (page: Page) => {
	const text = await summary(page).innerText();
	const [count] = text.split(" ");

	return Number(count);
};

test("the orders console opens without a date filter", async ({ page }) => {
	await page.goto("/admin/orders");

	await expect(page.getByRole("heading", { level: 1 })).toHaveText("Orders");
	await expect(picker(page)).toHaveText(/Any date/);
});

test("a preset writes the range and the timezone to the URL", async ({
	page,
}) => {
	await page.goto("/admin/orders");
	const total = await orderCount(page);

	await picker(page).click();
	await page.getByRole("button", { name: "Today", exact: true }).click();

	await expect(page).toHaveURL(/from=\d{4}-\d{2}-\d{2}/);
	await expect(page).toHaveURL(/to=\d{4}-\d{2}-\d{2}/);
	await expect(page).toHaveURL(/tz=-?\d+/);

	expect(await orderCount(page)).toBeLessThanOrEqual(total);
});

test("picking two days narrows the range and the clear button restores it", async ({
	page,
}) => {
	await page.goto("/admin/orders");
	const total = await orderCount(page);

	await picker(page).click();
	await page.getByRole("button", { name: /July 10th, 2026/ }).click();
	await page.getByRole("button", { name: /July 20th, 2026/ }).click();

	await expect(page).toHaveURL(/from=2026-07-10&to=2026-07-20/);
	await expect(summary(page)).toContainText("Jul 10, 2026 – Jul 20, 2026");

	const narrowed = await orderCount(page);
	expect(narrowed).toBeLessThan(total);

	await page.getByRole("button", { name: "Clear the date range" }).click();

	await expect(page).not.toHaveURL(/from=/);
	expect(await orderCount(page)).toBe(total);
});

test("the range survives a reload and combines with the status filter", async ({
	page,
}) => {
	await page.goto("/admin/orders?from=2026-07-01&to=2026-07-31&tz=-420");
	const ranged = await orderCount(page);

	await page.reload();
	expect(await orderCount(page)).toBe(ranged);

	await page.getByRole("button", { name: "pending", exact: true }).click();

	await expect(page).toHaveURL(/status=pending/);
	await expect(page).toHaveURL(/from=2026-07-01/);
	expect(await orderCount(page)).toBeLessThanOrEqual(ranged);
});

test("a nonsense range in the URL is ignored, not fatal", async ({ page }) => {
	await page.goto("/admin/orders");
	const total = await orderCount(page);

	for (const bad of ["from=2026-02-31", "from=nonsense", "to=31-07-2026"]) {
		await page.goto(`/admin/orders?${bad}`);

		await expect(page.getByRole("heading", { level: 1 })).toHaveText("Orders");
		expect(await orderCount(page)).toBe(total);
	}
});

test("future days cannot be picked", async ({ page }) => {
	await page.goto("/admin/orders");

	await picker(page).click();

	const grid = page.locator("[data-slot='popover-content']");
	await expect(grid).toBeVisible();

	const enabled = grid.locator("button[data-day]:not([disabled])");
	await expect(enabled).not.toHaveCount(0);

	// whatever the calendar happens to show, nothing after today is selectable
	const selectable = await enabled.evaluateAll((buttons) =>
		buttons.map((button) => button.getAttribute("data-day")),
	);
	const endOfToday = new Date().setHours(23, 59, 59, 999);

	for (const day of selectable) {
		expect(new Date(String(day)).getTime()).toBeLessThanOrEqual(endOfToday);
	}

	await grid.getByRole("button", { name: /next month/i }).click();
	await grid.getByRole("button", { name: /next month/i }).click();

	// two months forward is entirely in the future
	await expect(grid.locator("button[data-day]:not([disabled])")).toHaveCount(0);
	await expect(grid.locator("button[data-day][disabled]")).not.toHaveCount(0);
});

test("the overview report shows revenue, statuses and catalog counts", async ({
	page,
}) => {
	await page.goto("/admin");

	await expect(page.getByRole("heading", { level: 1 })).toHaveText("Overview");
	await expect(page.getByText("Report", { exact: true })).toBeVisible();

	for (const label of [
		"Revenue today",
		"This month",
		"Awaiting payment",
		"Customers",
	]) {
		await expect(page.getByText(label, { exact: true })).toBeVisible();
	}

	// every money tile renders a currency amount, not "NaN" or a raw decimal string
	const values = page.getByTestId("stat-value");
	await expect(values).toHaveCount(4);

	const amounts = await values.allTextContents();

	for (const amount of amounts.slice(0, 3)) {
		expect(amount).toMatch(/^\$[\d,]+\.\d{2}$/);
	}
	expect(amounts[3]).toMatch(/^\d+$/);

	await expect(page.getByText(/collected all time/)).toBeVisible();
});

test("the report asks the server for the browser's timezone", async ({
	page,
}) => {
	await page.goto("/admin");

	await expect(page).toHaveURL(/tz=-?\d+/);

	const tz = new URL(page.url()).searchParams.get("tz");
	expect(Number(tz)).toBe(
		await page.evaluate(() => new Date().getTimezoneOffset()),
	);
});

test("the status counts add up to the orders total and link through", async ({
	page,
}) => {
	await page.goto("/admin");

	const statusLinks = page.locator("section a");
	await expect(statusLinks).toHaveCount(4);

	const counts = await Promise.all(
		(await statusLinks.all()).map(async (link) =>
			Number((await link.innerText()).split("\n")[0]),
		),
	);
	const summed = counts.reduce((total, value) => total + value, 0);

	const ordersCard = page.getByRole("link", { name: /Orders/ }).last();
	const placed = Number((await ordersCard.innerText()).match(/\d+/)?.[0]);

	expect(summed).toBe(placed);

	await statusLinks.first().click();
	await expect(page).toHaveURL(/status=pending/);
	await expect(page.getByRole("heading", { level: 1 })).toHaveText("Orders");
});

test("the report is not fetched for a publisher", async ({ page }) => {
	await page.goto("/admin");
	await expect(page.getByText("Report", { exact: true })).toBeVisible();

	await page.goto("/account");
	await page.getByRole("button", { name: "Sign out" }).click();
	await expect(page).toHaveURL(/\/$|\/login/);

	await page.goto("/login");
	await page
		.getByLabel("Email", { exact: true })
		.fill("jeeseokjin@mailinator.com");
	await page.getByLabel("Password", { exact: true }).fill("KawiSeed2026!");
	await page.getByRole("button", { name: "Sign in" }).click();
	await expect(page).toHaveURL(/\/account/);

	await page.goto("/admin");

	await expect(page.getByText("Catalog", { exact: true })).toBeVisible();
	await expect(page.getByText("Report", { exact: true })).toHaveCount(0);
	await expect(page.getByText("Revenue today")).toHaveCount(0);
});

test("the report draws a revenue trend and a best sellers chart", async ({
	page,
}) => {
	await page.goto("/admin");

	await expect(page.getByText("Revenue, last 30 days")).toBeVisible();
	await expect(page.getByText("Best sellers")).toBeVisible();

	const surfaces = page.locator("svg.recharts-surface");
	await expect(surfaces).toHaveCount(2);

	// the trend renders as a filled area and the ranking as bars
	await expect(page.locator(".recharts-area-area")).toHaveCount(1);
	await expect(page.locator(".recharts-bar-rectangle").first()).toBeVisible();

	// the "settled" figure beside the trend is money, not a raw decimal
	await expect(page.getByText(/\$[\d,]+\.\d{2} settled/)).toBeVisible();
});

test("neither chart pushes the page sideways on a phone", async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 900 });
	await page.goto("/admin");

	await expect(page.locator("svg.recharts-surface")).toHaveCount(2);

	const overflows = await page.evaluate(
		() =>
			document.documentElement.scrollWidth >
			document.documentElement.clientWidth,
	);

	expect(overflows).toBe(false);
});

test("the reviews console lists every review with its book and reviewer", async ({
	page,
}) => {
	await page.goto("/admin/reviews");

	await expect(page.getByRole("heading", { level: 1 })).toHaveText("Reviews");

	const rows = page.locator("main div.divide-y > div");
	await expect(rows.first()).toBeVisible();

	const first = rows.first();
	await expect(first.locator('[role="img"]')).toHaveAttribute(
		"aria-label",
		/[1-5] out of 5/,
	);
	await expect(first.getByText(/@/)).toBeVisible();
	await expect(
		first.getByRole("button", { name: /Delete the review of/ }),
	).toBeVisible();
});

test("filtering by rating narrows the reviews and shows in the URL", async ({
	page,
}) => {
	await page.goto("/admin/reviews");

	const total = Number(
		(await page.locator("header p").first().innerText()).split(" ")[0],
	);

	await page.getByRole("button", { name: /^5/ }).click();

	await expect(page).toHaveURL(/rating=5/);
	await expect(page.locator("header p").first()).toContainText("5 star");

	const filtered = Number(
		(await page.locator("header p").first().innerText()).split(" ")[0],
	);
	expect(filtered).toBeLessThanOrEqual(total);

	// every remaining row really is five stars
	await expect(page.locator("main div.divide-y > div").first()).toBeVisible();

	const labels = await page
		.locator("main div.divide-y > div")
		.evaluateAll((items) =>
			items.map((item) =>
				item.querySelector('[role="img"]')?.getAttribute("aria-label"),
			),
		);
	for (const label of labels) {
		expect(label).toBe("5 out of 5");
	}
});

test("sorting by rating orders the reviews", async ({ page }) => {
	await page.goto("/admin/reviews?sortBy=rating&orderBy=asc&page=1&limit=20");

	// evaluateAll does not auto-wait, so make sure the rows are rendered first
	await expect(page.locator("main div.divide-y > div").first()).toBeVisible();

	const ratings = await page
		.locator("main div.divide-y > div")
		.evaluateAll((items) =>
			items.map((item) =>
				Number(
					item
						.querySelector('[role="img"]')
						?.getAttribute("aria-label")
						?.charAt(0),
				),
			),
		);

	expect(ratings.length).toBeGreaterThan(1);
	expect(ratings).toEqual([...ratings].sort((a, b) => a - b));
});

test("dismissing the delete confirmation keeps the review", async ({
	page,
}) => {
	await page.goto("/admin/reviews");

	const count = () =>
		page
			.locator("header p")
			.first()
			.innerText()
			.then((text) => Number(text.split(" ")[0]));

	const before = await count();

	page.once("dialog", (dialog) => dialog.dismiss());
	await page
		.getByRole("button", { name: /Delete the review of/ })
		.first()
		.click();

	await expect(page.locator("header p").first()).toContainText(`${before}`);
	expect(await count()).toBe(before);
});

test("the reviews console is closed to a publisher", async ({ page }) => {
	await page.goto("/account");
	await page.getByRole("button", { name: "Sign out" }).click();
	await expect(page).toHaveURL(/\/$|\/login/);

	await page.goto("/login");
	await page
		.getByLabel("Email", { exact: true })
		.fill("jeeseokjin@mailinator.com");
	await page.getByLabel("Password", { exact: true }).fill("KawiSeed2026!");
	await page.getByRole("button", { name: "Sign in" }).click();
	await expect(page).toHaveURL(/\/account/);

	await page.goto("/admin/reviews");

	await expect(page).toHaveURL(/\/admin$/);
	await expect(page.locator("aside").getByText("Reviews")).toHaveCount(0);
});
