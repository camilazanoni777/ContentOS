import { test, expect } from "@playwright/test";

test("página inicial redireciona usuário anônimo para tela de login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/.*login.*/);
});
