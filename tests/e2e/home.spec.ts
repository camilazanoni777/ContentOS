import { test, expect } from "@playwright/test";

test("página inicial mostra que o projeto está configurado", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Cami Content OS" })).toBeVisible();
  await expect(page.getByText("Capturar ideia")).toBeVisible();
});
