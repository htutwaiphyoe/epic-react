import { expect, type Page, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

const emptyCart = async (page: Page) => {
	await page.goto("/cart");

	const clear = page.getByRole("button", { name: "Clear cart" });
	const empty = page.getByText("Your cart is empty");

	await expect(clear.or(empty).first()).toBeVisible();

	if (await clear.isVisible()) {
		await clear.click();
		await expect(empty).toBeVisible();
	}
};

// sorted by stock so quantity tests are not at the mercy of what previous runs bought
const fillAddress = async (page: Page) => {
	await page.locator("#recipient").fill("E2E Recipient");
	await page.locator("#phone").fill("+95 9 111 222 333");
	await page.locator("#line1").fill("12 Pyay Road");
	await page.locator("#city").fill("Yangon");
	await page.locator("#country").fill("Myanmar");
};

const addNthBook = async (page: Page, index: number) => {
	await page.goto("/books?sortBy=stock&orderBy=desc");
	await page
		.getByTestId("book-grid")
		.locator("a[href^='/books/']")
		.nth(index)
		.click();
	await page.getByRole("button", { name: "Add to cart" }).click();
	await expect(page.getByRole("link", { name: "View in cart" })).toBeVisible();
};

test("adds books, adjusts quantity, and the subtotal follows", async ({
	page,
}) => {
	await emptyCart(page);
	await addNthBook(page, 0);

	await page.goto("/cart");
	const line = page.getByTestId("cart-line").first();
	await expect(line).toBeVisible();

	const quantity = line.locator("span[aria-live='polite']");
	await expect(quantity).toHaveText("1");

	const subtotal = page.getByTestId("cart-subtotal");
	const single = await subtotal.innerText();

	await line.getByLabel("Increase quantity").click();
	await expect(quantity).toHaveText("2");
	await expect(subtotal).not.toHaveText(single);

	const double = await subtotal.innerText();
	expect(double).not.toBe(single);

	await line.getByLabel("Decrease quantity").click();
	await expect(quantity).toHaveText("1");
	await expect(subtotal).toHaveText(single);
});

test("cannot decrease below one", async ({ page }) => {
	await emptyCart(page);
	await addNthBook(page, 0);

	await page.goto("/cart");
	const line = page.getByTestId("cart-line").first();

	await expect(line.locator("span[aria-live='polite']")).toHaveText("1");
	await expect(line.getByLabel("Decrease quantity")).toBeDisabled();
});

test("removes a line", async ({ page }) => {
	await emptyCart(page);
	await addNthBook(page, 0);

	await page.goto("/cart");
	await page.getByRole("button", { name: "Remove" }).first().click();

	await expect(page.getByText("Your cart is empty")).toBeVisible();
});

test("checks out only the selected lines and keeps the rest", async ({
	page,
}) => {
	await emptyCart(page);
	await addNthBook(page, 0);
	await addNthBook(page, 1);

	await page.goto("/cart");
	await expect(page.getByTestId("cart-line")).toHaveCount(2);

	await page.getByTestId("cart-line").nth(1).getByRole("checkbox").uncheck();
	await expect(page.getByText(/1 of 2 selected/)).toBeVisible();

	await fillAddress(page);
	await page.getByRole("button", { name: "Place order" }).click();

	await expect(page).toHaveURL(/\/account\/orders\/[0-9a-f-]{36}/);
	await expect(page.getByRole("heading", { name: "1 book" })).toBeVisible();
	await expect(page.getByText("pending").first()).toBeVisible();

	await page.goto("/cart");
	await expect(page.getByTestId("cart-line")).toHaveCount(1);
});

test("an order appears in the order history", async ({ page }) => {
	await emptyCart(page);
	await addNthBook(page, 0);

	await page.goto("/cart");
	await fillAddress(page);
	await page.getByRole("button", { name: "Place order" }).click();
	await expect(page).toHaveURL(/\/account\/orders\/[0-9a-f-]{36}/);

	await page.goto("/account/orders");
	await expect(page.getByRole("heading", { name: "Orders" })).toBeVisible();
	await expect(
		page.locator("a[href^='/account/orders/']").first(),
	).toBeVisible();
});

test("cancels a pending order", async ({ page }) => {
	await emptyCart(page);
	await addNthBook(page, 0);

	await page.goto("/cart");
	await fillAddress(page);
	await page.getByRole("button", { name: "Place order" }).click();
	await expect(page).toHaveURL(/\/account\/orders\/[0-9a-f-]{36}/);

	await page.getByRole("button", { name: "Cancel order" }).click();
	await expect(page.getByText("cancelled")).toBeVisible();
	await expect(page.getByRole("button", { name: "Cancel order" })).toHaveCount(
		0,
	);
});

test("the cart requires signing in", async ({ browser }) => {
	const anonymous = await browser.newContext({ storageState: undefined });
	const page = await anonymous.newPage();

	await page.goto("/cart");
	await expect(page).toHaveURL(/\/login/);

	await anonymous.close();
});

test("refuses to place an order without a delivery address", async ({
	page,
}) => {
	await emptyCart(page);
	await addNthBook(page, 0);

	await page.goto("/cart");
	await page.getByRole("button", { name: "Place order" }).click();

	await expect(
		page.getByText("Add a delivery address to place your order."),
	).toBeVisible();
	await expect(page).toHaveURL(/\/cart/);
});

test("keeps the delivery address with the order", async ({ page }) => {
	await emptyCart(page);
	await addNthBook(page, 0);

	await page.goto("/cart");
	await fillAddress(page);
	await page.getByRole("button", { name: "Place order" }).click();

	await expect(page).toHaveURL(/\/account\/orders\/[0-9a-f-]{36}/);
	await expect(page.getByText("Delivering to")).toBeVisible();
	await expect(page.getByText("E2E Recipient")).toBeVisible();
	await expect(page.getByText("12 Pyay Road")).toBeVisible();
});
