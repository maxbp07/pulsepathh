import { test, expect } from '@playwright/test';

test('login screen loads and validates code format', async ({ page }) => {
  await page.goto('./#/login');
  await expect(page.getByRole('button', { name: /entrar|login/i })).toBeVisible();
  const input = page.getByPlaceholder(/PP-2026|PP-2026-001|ejemplo/i);
  await input.fill('INVALID');
  await page.getByRole('button', { name: /entrar|login/i }).click();
  await expect(page.getByText(/inválido|invalid/i)).toBeVisible();
});
