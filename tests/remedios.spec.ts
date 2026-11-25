import { test, expect } from '@playwright/test';
import path from 'path';
import { pathToFileURL } from 'url';

test.describe('Remédios Redesign Gamificado UI', () => {
  test('renders Missão, celebrates +1 dia!, and navigates Redução and Estoque without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    const url = pathToFileURL(path.join(__dirname, '..', 'index.html')).href;
    await page.goto(url);

    // 1. Hoje tab
    await expect(page.getByRole('heading', { name: 'Faltam 6 doses.' })).toBeVisible();
    await expect(page.getByText('Missão')).toBeVisible();
    await page.screenshot({ path: 'test-results/hoje.png' });

    // 2. Mark all 6 doses to trigger "+1 dia!" celebration
    for (let i = 0; i < 6; i++) {
      await page.getByRole('button', { name: '✓ Tomei' }).click();
    }
    await expect(page.getByText('+1 dia!')).toBeVisible();
    await page.screenshot({ path: 'test-results/celebracao.png' });

    // Undo last dose
    await page.getByRole('button', { name: 'Desfazer' }).click();
    await expect(page.getByRole('heading', { name: 'Falta 1 dose.' })).toBeVisible();

    // 3. Redução tab
    await page.getByRole('button', { name: 'Redução' }).click();
    await expect(page.getByRole('heading', { name: 'Guia de redução' })).toBeVisible();
    await page.getByRole('button', { name: 'Pregabalina' }).click();
    await expect(page.getByText('Pregabalina · etapa 1 de 1')).toBeVisible();
    await page.screenshot({ path: 'test-results/reducao.png' });

    // 4. Estoque tab
    await page.getByRole('button', { name: 'Estoque' }).click();
    await expect(page.getByRole('heading', { name: 'Estoque e reposição' })).toBeVisible();
    await page.getByRole('button', { name: 'Chegou remédio' }).first().click();
    await expect(page.getByText('15 dias')).toBeVisible();
    await page.screenshot({ path: 'test-results/estoque.png' });

    expect(errors).toEqual([]);
  });
});
