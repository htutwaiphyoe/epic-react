import { expect, test } from "@playwright/test";

const SEEDED = {
	name: "Jee Seok-jin",
	email: "jeeseokjin@mailinator.com",
	password: "KawiSeed2026!",
};

const signIn = async (page: import("@playwright/test").Page) => {
	await page.getByLabel("Email", { exact: true }).fill(SEEDED.email);
	await page.getByLabel("Password", { exact: true }).fill(SEEDED.password);
	await page.getByRole("button", { name: "Sign in" }).click();
};

test("guards /account and redirects back after signing in", async ({
	page,
}) => {
	await page.goto("/account");
	await expect(page).toHaveURL(/\/login/);

	await signIn(page);

	await expect(page).toHaveURL(/\/account/);
	await expect(page.getByRole("heading", { name: SEEDED.name })).toBeVisible();
	await expect(page.getByText(SEEDED.email)).toBeVisible();
});

test("rejects a wrong password with the backend's message", async ({
	page,
}) => {
	await page.goto("/login");

	await page.getByLabel("Email", { exact: true }).fill(SEEDED.email);
	await page.getByLabel("Password", { exact: true }).fill("definitely-wrong");
	await page.getByRole("button", { name: "Sign in" }).click();

	await expect(page.getByText("Invalid email or password.")).toBeVisible();
	await expect(page).toHaveURL(/\/login/);
});

test("signs up, lands on the account page, and survives a reload", async ({
	page,
}) => {
	const email = `e2e-${Date.now()}@mailinator.com`;

	await page.goto("/signup");
	await page.getByLabel("Name", { exact: true }).fill("E2E Tester");
	await page.getByLabel("Email", { exact: true }).fill(email);
	await page.getByLabel("Password", { exact: true }).fill("supersecret123");
	await page.getByRole("button", { name: "Create account" }).click();

	await expect(page).toHaveURL(/\/account/);
	await expect(page.getByText(email)).toBeVisible();

	await page.reload();
	await expect(page.getByText(email)).toBeVisible();
});

test("signing out clears the session", async ({ page }) => {
	await page.goto("/login");
	await signIn(page);
	await expect(page).toHaveURL(/\/account/);

	await page.getByRole("button", { name: "Sign out" }).click();
	await expect(page).toHaveURL("/");
	await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();

	await page.goto("/account");
	await expect(page).toHaveURL(/\/login/);
});

test("the session cookie is not readable from JavaScript", async ({ page }) => {
	await page.goto("/login");
	await signIn(page);
	await expect(page).toHaveURL(/\/account/);

	const visible = await page.evaluate(() =>
		document.cookie.includes("kawi-session"),
	);
	expect(visible).toBe(false);
});
