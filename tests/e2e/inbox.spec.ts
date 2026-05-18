import { test, expect } from "@playwright/test";

/**
 * Inbox e2e — smoke. These tests run against the built app on
 * http://127.0.0.1:3000 (configured via playwright.config.ts).
 *
 * Without Clerk keys provisioned the inbox renders with the
 * "Sign in to see conversations" friendly-error banner. The shell still
 * paints (top bar, empty queue, fan intelligence placeholder), so these
 * assertions verify the layout is alive without depending on auth state.
 */

test("inbox renders the top bar and queue scaffolding", async ({ page }) => {
  await page.goto("/inbox");
  await expect(page.getByText("Inbox")).toBeVisible();
  await expect(page.getByText(/Priority Queue/i)).toBeVisible();
});

test("inbox shows an empty-queue message when no conversations exist", async ({ page }) => {
  await page.goto("/inbox");
  // Either the friendly auth banner or the empty-queue copy resolves —
  // both prove the Server Component shipped the props through the shell.
  const anyEmptyState = page.locator(
    'text=/No conversations yet|Sign in to see conversations/i',
  );
  await expect(anyEmptyState.first()).toBeVisible();
});

test("a deep-linked conversation route loads the same shell without crashing", async ({ page }) => {
  // Bogus id — the Server Component should surface the error banner rather
  // than 500, proving the [conversationId] route handles the missing case.
  await page.goto("/inbox/00000000-0000-0000-0000-000000000000");
  await expect(page.getByText("Inbox")).toBeVisible();
});
