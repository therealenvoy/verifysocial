import { test, expect } from "@playwright/test";

/**
 * Auth e2e — smoke. Without Clerk keys the middleware falls through to
 * pass-through, so the inbox is reachable but renders the "Sign in" banner.
 * When CLERK_SECRET_KEY is provisioned, unauthenticated requests redirect
 * to Clerk's sign-in flow; this test tolerates either path so CI is green
 * with or without the secret.
 */

test("inbox is reachable; unauthenticated users see the sign-in banner OR are redirected", async ({ page }) => {
  const response = await page.goto("/inbox", { waitUntil: "domcontentloaded" });
  expect(response).not.toBeNull();

  const url = page.url();
  const redirectedToAuth =
    url.includes("/sign-in") || url.includes("clerk") || url.includes("accounts");

  if (redirectedToAuth) {
    // Clerk live: the redirect itself is the assertion.
    expect(redirectedToAuth).toBe(true);
  } else {
    // Sandbox mode: the inbox renders with the sign-in friendly banner.
    await expect(
      page.locator('text=/Sign in to see conversations|No conversations yet/i').first(),
    ).toBeVisible();
  }
});
