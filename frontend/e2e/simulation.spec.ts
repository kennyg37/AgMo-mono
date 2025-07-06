import { test, expect } from '@playwright/test';

test('simulation controls work', async ({ page }) => {
  await page.goto('/');

  // Check if control panel is visible
  await expect(page.getByText('Control Panel')).toBeVisible();

  // Test start/pause button
  const startButton = page.getByRole('button', { name: /start/i });
  await expect(startButton).toBeVisible();
  
  // Test CNN overlay toggle
  const cnnButton = page.getByRole('button', { name: /cnn overlay/i });
  await expect(cnnButton).toBeVisible();
  await cnnButton.click();
  
  // Test reset button
  const resetButton = page.getByRole('button', { name: /reset/i });
  await expect(resetButton).toBeVisible();
});

test('debug panel shows telemetry', async ({ page }) => {
  await page.goto('/');

  // Check if debug panel is visible
  await expect(page.getByText('Debug Panel')).toBeVisible();
  
  // Check telemetry sections
  await expect(page.getByText('Simulation')).toBeVisible();
  await expect(page.getByText('Drone Telemetry')).toBeVisible();
  await expect(page.getByText('Plant Health')).toBeVisible();
  await expect(page.getByText('Camera Feed')).toBeVisible();
});