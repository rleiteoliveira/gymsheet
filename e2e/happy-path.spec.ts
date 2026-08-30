import { expect, test } from '@playwright/test';

test('começa um treino, registra uma série, finaliza e abre a Semana', async ({ page }) => {
  await page.route('**/free-exercise-db/main/dist/exercises.json', (route) => route.abort());
  await page.goto('/');

  const launcher = page.getByTestId('start-workout');
  await expect(launcher).toBeVisible();
  await expect(launcher).toHaveText('Começar treino');
  await launcher.click();

  const quickStartDialog = page.getByRole('dialog', { name: 'Começar treino' });
  await expect(quickStartDialog).toBeVisible();
  await quickStartDialog.getByLabel('Nome do treino').fill('Treino E2E');
  const chestChip = quickStartDialog.getByRole('button', { name: 'Peito', exact: true });
  if (await chestChip.count()) await chestChip.click();
  await quickStartDialog.getByRole('button', { name: 'Começar treino', exact: true }).click();

  const pickerDialog = page.getByRole('dialog', { name: 'Adicionar na sessão' });
  await expect(pickerDialog).toBeVisible();
  await pickerDialog.locator('button.picker-item').first().click();

  await expect(page.getByTestId('quick-set-done')).toBeVisible();
  await page.getByTestId('quick-set-done').click();
  await expect(page.getByTestId('start-workout')).toHaveCount(0);

  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await expect(launcher).toBeVisible();
  await expect(launcher).toHaveText('Retomar treino');
  await launcher.click();
  await expect(page.getByRole('heading', { name: 'Treino E2E', exact: true })).toBeVisible();
  await expect(page.getByText('Série 1', { exact: true })).toBeVisible();

  await expect(page.getByTestId('finish-workout')).toBeVisible();
  await page.getByTestId('finish-workout').click();
  await expect(launcher).toBeVisible();
  await expect(launcher).toHaveText('Começar treino');

  await page.getByTestId('week-tab').click();
  await expect(page.getByRole('heading', { name: 'Calendário', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Treino E2E/ })).toBeVisible();
  await expect(page.getByText('Concluída', { exact: true })).toBeVisible();
  await expect(launcher).toBeVisible();

  await page.getByRole('button', { name: 'Fichas', exact: true }).click();
  await expect(launcher).toBeVisible();
  await page.getByTestId('week-tab').click();
  await expect(launcher).toBeVisible();
  await page.getByRole('button', { name: 'Dados', exact: true }).click();
  await expect(launcher).toBeVisible();
});
