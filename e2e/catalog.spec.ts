import { expect, test } from "@playwright/test";

const gridCardTitles = (page: import("@playwright/test").Page) =>
	page.getByTestId("book-grid").locator("a[href^='/books/'] h3");

test("browses from home to a book detail page", async ({ page }) => {
	await page.goto("/");
	await expect(page.getByRole("heading", { name: /The chess/ })).toBeVisible();

	await page.getByRole("link", { name: "Browse the catalog" }).click();
	await expect(page).toHaveURL(/\/books/);
	await expect(
		page.getByRole("heading", { name: "Books", level: 1 }),
	).toBeVisible();

	const firstTitle = gridCardTitles(page).first();
	const title = await firstTitle.innerText();
	await firstTitle.click();

	await expect(
		page.getByRole("heading", { level: 1, name: title }),
	).toBeVisible();
});

test("sorting writes to the URL and reorders results", async ({ page }) => {
	await page.goto("/books?sortBy=price&orderBy=asc");
	await expect(gridCardTitles(page).first()).toHaveText(
		"Bobby Fischer Teaches Chess",
	);

	await page.getByRole("button", { name: "Sort ascending" }).click();
	await expect(page).toHaveURL(/orderBy=desc/);
	await expect(gridCardTitles(page).first()).toHaveText(
		"The Oxford Companion to Chess",
	);

	await page.getByRole("combobox", { name: "Sort by" }).click();
	await page.getByRole("option", { name: "Title" }).click();
	await expect(page).toHaveURL(/sortBy=title/);
});

test("search filters the catalog", async ({ page }) => {
	await page.goto("/books");

	await page.getByPlaceholder("Search titles…").fill("dummies");
	await page.getByPlaceholder("Search titles…").press("Enter");

	await expect(page).toHaveURL(/search=dummies/);
	await expect(gridCardTitles(page)).toHaveCount(1);
	await expect(gridCardTitles(page).first()).toContainText("Chess for Dummies");
});

test("pagination moves between pages", async ({ page }) => {
	await page.goto("/books?limit=10");
	await expect(page.getByText("1 / 3")).toBeVisible();

	await page.getByRole("link", { name: "Next" }).click();
	await expect(page).toHaveURL(/page=2/);
	await expect(page.getByText("2 / 3")).toBeVisible();
});

test("an author page lists that author's books", async ({ page }) => {
	await page.goto("/authors");
	await expect(
		page.getByRole("heading", { name: "Authors", level: 1 }),
	).toBeVisible();

	const firstAuthor = page
		.getByTestId("author-grid")
		.locator("a[href^='/authors/']")
		.first();
	const name = await firstAuthor.locator("h2").innerText();
	await firstAuthor.click();

	await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
	await expect(
		page.getByRole("heading", { name: /^\d+ titles?$/ }),
	).toBeVisible();
});

test("an unknown book id renders the error boundary, not a crash", async ({
	page,
}) => {
	await page.goto("/books/00000000-0000-0000-0000-000000000000");

	await expect(page.getByText("Something went wrong")).toBeVisible();
	await expect(page.getByText("Book is not found.")).toBeVisible();
});
