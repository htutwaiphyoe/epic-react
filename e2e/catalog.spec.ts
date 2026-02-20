import { expect, test } from "@playwright/test";

test("browses from home to a book detail page", async ({ page }) => {
	await page.goto("/");
	await expect(
		page.getByRole("heading", { name: "Chess books, catalogued." }),
	).toBeVisible();

	await page.getByRole("link", { name: "Browse all books" }).click();
	await expect(page).toHaveURL(/\/books/);
	await expect(
		page.getByRole("heading", { name: "Books", level: 1 }),
	).toBeVisible();

	const firstCard = page.locator("a[href^='/books/']").first();
	const title = await firstCard.locator("h3").innerText();
	await firstCard.click();

	await expect(
		page.getByRole("heading", { level: 1, name: title }),
	).toBeVisible();
});

test("sorting writes to the URL and reorders results", async ({ page }) => {
	const firstTitle = page.locator("a[href^='/books/'] h3").first();

	await page.goto("/books?sortBy=price&orderBy=asc");
	await expect(firstTitle).toHaveText("Chess Fundamentals");

	await page.locator("#orderBy").selectOption("desc");
	await expect(page).toHaveURL(/orderBy=desc/);
	await expect(firstTitle).toHaveText("Dvoretsky's Endgame Manual");
});

test("search filters the catalog", async ({ page }) => {
	await page.goto("/books");

	await page.getByPlaceholder("Search titles…").fill("endgame");
	await page.getByPlaceholder("Search titles…").press("Enter");

	await expect(page).toHaveURL(/search=endgame/);
	await expect(page.locator("a[href^='/books/'] h3")).toHaveCount(1);
	await expect(page.locator("a[href^='/books/'] h3").first()).toContainText(
		"Endgame Manual",
	);
});

test("pagination moves between pages", async ({ page }) => {
	await page.goto("/books?limit=4");
	await expect(page.getByText(/Page 1 of 3/)).toBeVisible();

	await page.getByRole("link", { name: "Next ›" }).click();
	await expect(page).toHaveURL(/page=2/);
	await expect(page.getByText(/Page 2 of 3/)).toBeVisible();
});

test("an author page lists that author's books", async ({ page }) => {
	await page.goto("/authors");
	await expect(
		page.getByRole("heading", { name: "Authors", level: 1 }),
	).toBeVisible();

	const firstAuthor = page.locator("a[href^='/authors/']").first();
	const name = await firstAuthor.locator("span").first().innerText();
	await firstAuthor.click();

	await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
	await expect(page.getByRole("heading", { name: /^Books \(/ })).toBeVisible();
});

test("an unknown book id renders the error boundary, not a crash", async ({
	page,
}) => {
	await page.goto("/books/00000000-0000-0000-0000-000000000000");

	await expect(page.getByText("Something went wrong")).toBeVisible();
	await expect(page.getByText("Book is not found.")).toBeVisible();
});
