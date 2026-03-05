import { expect, test as setup } from "@playwright/test";

export const SEEDED = {
	email: "jeeseokjin@mailinator.com",
	password: "KawiSeed2026!",
};

export const ADMIN = {
	email: "kawi@mailinator.com",
	password: "KawiSeed2026!",
};

export const SESSION_FILE = "e2e/.session.json";
export const ADMIN_SESSION_FILE = "e2e/.admin-session.json";

setup("sign in once and save the session", async ({ page }) => {
	await page.goto("/login");
	await page.getByLabel("Email", { exact: true }).fill(SEEDED.email);
	await page.getByLabel("Password", { exact: true }).fill(SEEDED.password);
	await page.getByRole("button", { name: "Sign in" }).click();

	await expect(page).toHaveURL(/\/account/);

	await page.context().storageState({ path: SESSION_FILE });
});

setup("sign in once as admin and save the session", async ({ page }) => {
	await page.goto("/login");
	await page.getByLabel("Email", { exact: true }).fill(ADMIN.email);
	await page.getByLabel("Password", { exact: true }).fill(ADMIN.password);
	await page.getByRole("button", { name: "Sign in" }).click();

	await expect(page).toHaveURL(/\/account/);

	await page.context().storageState({ path: ADMIN_SESSION_FILE });
});
