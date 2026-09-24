import { test, expect } from '@playwright/test';

test('login page renders TeamFlow brand', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'TeamFlow' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
});

test('can sign in with seeded user when API is up', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('alice@teamflow.dev');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await expect(page.getByText('Projects').first()).toBeVisible();
});
