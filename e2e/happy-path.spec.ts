import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { FALLBACK_EXERCISES, toSnapshot } from '../lib/catalog';
import { createQuickSession, createSessionFromPlan } from '../lib/session';
import type { AppState, Plan } from '../lib/types';

test.use({ timezoneId: 'America/Fortaleza' });
const now = new Date('2026-09-06T15:00:00Z');
const yesterday = new Date('2026-09-05T15:00:00Z');
const empty: AppState = { plans: [], sessions: [], todayPin: null };
const plan: Plan = {
  id: 'plan-peito', name: 'Peito', emoji: null, createdAt: now.toISOString(), updatedAt: now.toISOString(),
  exercises: [{ id: 'plan-exercise', order: 0, exercise: { ...toSnapshot(FALLBACK_EXERCISES[0]), images: [] }, targetSets: 1, targetReps: 10, targetKg: 20 }],
};
const pinned: AppState = { plans: [plan], sessions: [], todayPin: { kind: 'plan', id: plan.id } };

async function readState(page: Page): Promise<AppState> {
  return page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open('treino-de-hoje', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction('app', 'readonly');
      const value = transaction.objectStore('app').get('state');
      value.onsuccess = () => resolve(value.result ?? { plans: [], sessions: [], todayPin: null });
      value.onerror = () => reject(value.error);
      transaction.oncomplete = () => db.close();
    };
  }));
}

async function openApp(page: Page, state?: AppState, offline = false) {
  await page.clock.setFixedTime(now);
  await page.route('**/free-exercise-db/main/dist/exercises.json', (route) => offline
    ? route.abort()
    : route.fulfill({ json: FALLBACK_EXERCISES.map((exercise) => ({ ...exercise, images: [] })) }));
  await page.route('**/free-exercise-db/main/exercises/**', (route) => route.abort());
  await page.goto('/');
  await expect(page.getByTestId('start-workout')).toBeVisible();
  if (state) {
    await page.evaluate((data) => new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('treino-de-hoje', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('app', 'readwrite');
        tx.objectStore('app').put(data, 'state');
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => reject(tx.error);
      };
    }), state);
    await page.reload();
    await expect(page.getByTestId('start-workout')).toBeVisible();
  }
}

async function goTo(page: Page, destination: string) {
  await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'GymSheet', exact: true });
  await dialog.getByRole('button', { name: destination, exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('main h1')).toBeFocused();
}

async function capture(page: Page, info: TestInfo, name: string) {
  await mkdir('output/playwright', { recursive: true });
  const path = 'output/playwright/' + name + '.png';
  const menu = page.locator('.essential-menu');
  const menuOpen = await menu.count() > 0;
  if (menuOpen) {
    await expect(menu).toHaveCSS('transform', 'none');
    await expect(page.locator('.essential-menu-overlay')).toHaveCSS('opacity', '1');
  }
  await page.screenshot({ path, fullPage: !menuOpen, animations: 'disabled' });
  await info.attach(name, { path, contentType: 'image/png' });
}

const freeSessionName = 'Treino · domingo 06/09';

test('começa livre, persiste série, recarrega, retoma o mesmo ID e conclui no calendário', async ({ page }) => {
  await openApp(page);
  const launcher = page.getByTestId('start-workout');
  await expect(launcher).toHaveText('Começar');
  await launcher.click();
  await expect(page.getByRole('dialog', { name: 'Começar treino' })).toHaveCount(0);
  const picker = page.getByRole('dialog', { name: 'Adicionar na sessão' });
  await expect(page.getByText(/nos últimos 30 dias/)).toHaveCount(0);
  await expect(page.locator('.essential-sheet[data-starting="true"]')).toBeVisible();
  await picker.locator('button.picker-item').first().click();
  await expect(page.locator('.session-clock, .progress-track, .status-chip')).toHaveCount(0);
  await page.getByLabel('Peso em quilogramas').fill('25');
  await page.getByLabel('Repetições', { exact: true }).fill('12');
  await page.getByTestId('quick-set-done').click();
  await expect.poll(async () => (await readState(page)).sessions[0]?.exercises[0]?.sets.length).toBe(1);
  const recorded = (await readState(page)).sessions[0];
  expect(recorded.sourcePlanName).toBe(freeSessionName);
  expect(recorded.exercises[0].sets[0]).toMatchObject({ kg: 25, reps: 12 });
  await expect(launcher).toHaveCount(0);
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await page.reload();
  await expect(launcher).toHaveText('Retomar');
  await expect(page.getByRole('button', { name: /Escolher ficha:/ })).toHaveCount(0);
  await launcher.click();
  await expect(page.getByRole('heading', { name: freeSessionName, exact: true })).toBeVisible();
  await expect(page.getByText('Série 1', { exact: true })).toBeVisible();
  expect((await readState(page)).sessions).toEqual([recorded]);
  await page.getByTestId('finish-workout').click();
  await expect(launcher).toHaveText('Começar');
  await expect.poll(async () => (await readState(page)).sessions[0]?.state).toBe('completed');
  const completed = (await readState(page)).sessions[0];
  expect(completed).toMatchObject({ id: recorded.id, exercises: recorded.exercises, completedAt: now.toISOString() });
  await page.reload();
  await goTo(page, 'Calendário');
  await expect(page.getByRole('heading', { name: 'Calendário', exact: true })).toBeVisible();
  await expect(page.getByText('Top skipped')).toHaveCount(0);
  await expect(page.getByText('O que aconteceu')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: /Treino · domingo 06\/09/ })).toBeVisible();
  await expect(page.getByText(/Concluída/)).toBeVisible();
  await expect(launcher).toHaveCount(0);
  expect((await readState(page)).sessions).toEqual([completed]);
  await page.getByRole('button', { name: 'Adicionar sessão neste dia', exact: true }).click();
  const retroactive = page.getByRole('dialog', { name: 'Nova sessão', exact: true });
  await expect(retroactive).toBeVisible();
  await retroactive.getByRole('button', { name: 'Agora não', exact: true }).click();
  await expect(retroactive).toHaveCount(0);
  expect((await readState(page)).sessions).toEqual([completed]);
  await goTo(page, 'Histórico');
  await expect(page.getByRole('heading', { name: 'Histórico', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: freeSessionName, exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Começar sessão vazia' })).toHaveCount(0);
  await goTo(page, 'Treino');
  await launcher.click();
  await expect(page.getByRole('dialog', { name: 'Adicionar na sessão' })).toBeVisible();
  const afterRestart = await readState(page);
  expect(afterRestart.sessions[0]).toEqual(completed);
  expect(afterRestart.sessions).toHaveLength(2);
});

test('cria ficha pelo editor e picker, sem ranking visível', async ({ page }, info) => {
  await openApp(page);
  await goTo(page, 'Fichas');
  await expect(page.getByRole('heading', { name: 'Fichas', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Fichas (0)' })).toHaveCount(0);
  await capture(page, info, 'essencial-fichas-vazia');
  await page.getByRole('button', { name: 'Nova ficha', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Nova ficha', exact: true });
  await editor.getByLabel('Nome da ficha').fill('Pernas');
  await capture(page, info, 'essencial-editor-ficha');
  await editor.getByRole('button', { name: 'Adicionar', exact: true }).click();
  const planPicker = page.getByRole('dialog', { name: 'Adicionar à ficha' });
  await expect(page.getByText(/nos últimos 30 dias/)).toHaveCount(0);
  await capture(page, info, 'essencial-picker');
  await planPicker.locator('button.picker-item').first().click();
  await editor.getByRole('button', { name: 'Salvar ficha', exact: true }).click();
  await expect.poll(async () => (await readState(page)).plans.map((item) => item.name)).toEqual(['Pernas']);
  await expect(page.getByRole('heading', { name: 'Pernas', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Fixar Pernas', exact: true }).click();
  await expect.poll(async () => (await readState(page)).todayPin).toEqual({ kind: 'plan', id: (await readState(page)).plans[0].id });
  await capture(page, info, 'essencial-fichas-fixada');
  expect((await readState(page)).sessions).toEqual([]);
});

test('nome abre Fichas e fixar permanece explícito, sem criar sessão', async ({ page }) => {
  await openApp(page, { ...empty, plans: [plan] });
  const selector = page.getByRole('button', { name: 'Escolher ficha: Treino livre', exact: true });
  await selector.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('main h1')).toBeFocused();
  expect(await readState(page)).toEqual({ ...empty, plans: [plan] });
  await page.getByRole('button', { name: 'Fixar Peito', exact: true }).click();
  await expect.poll(async () => (await readState(page)).todayPin).toEqual(pinned.todayPin);
  await goTo(page, 'Treino');
  await expect(page.getByRole('button', { name: 'Escolher ficha: Peito', exact: true })).toBeVisible();
  expect((await readState(page)).sessions).toEqual([]);
  await page.getByTestId('start-workout').click();
  await expect(page.getByRole('heading', { name: 'Peito', exact: true })).toBeVisible();
  await expect(page.locator('.essential-session[data-starting="true"]')).toBeVisible();
  await expect.poll(async () => (await readState(page)).sessions.length).toBe(1);
  expect((await readState(page)).sessions[0]).toMatchObject({ sourcePlanId: plan.id, sourcePlanName: plan.name, state: 'in_progress' });
});

test('partida com movimento reduzido mostra o destino sem atraso', async ({ page }) => {
  await openApp(page, pinned);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByTestId('start-workout').click();
  await expect(page.getByRole('heading', { name: 'Peito', exact: true })).toBeVisible();
  await expect(page.locator('.essential-session[data-starting="true"]')).toHaveCount(0);
  expect((await readState(page)).sessions[0]).toMatchObject({ sourcePlanId: plan.id, sourcePlanName: plan.name, state: 'in_progress' });
});

test('menu oferece cinco destinos, contém foco e fecha por teclado e clique externo', async ({ page }) => {
  await openApp(page, pinned);
  const trigger = page.getByRole('button', { name: 'Abrir menu', exact: true });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'GymSheet', exact: true });
  const close = dialog.getByRole('button', { name: 'Fechar menu', exact: true });
  await expect(close).toBeFocused();
  await expect(dialog.getByRole('navigation').getByRole('button')).toHaveCount(5);
  await expect(dialog.getByRole('button', { name: 'Treino', exact: true })).toHaveAttribute('aria-current', 'page');
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('button', { name: 'Dados e backup', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.mouse.click(380, 420);
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(await readState(page)).toEqual(pinned);
  await trigger.click();
  await close.click();
  await expect(trigger).toBeFocused();
  for (const [destination, title] of [
    ['Fichas', 'Fichas'], ['Histórico', 'Histórico'],
    ['Calendário', 'Calendário'], ['Dados e backup', 'Dados'], ['Treino', 'Peito'],
  ]) {
    await goTo(page, destination);
    await expect(page.locator('main h1')).toContainText(title);
    if (destination === 'Fichas') await expect(page.getByRole('heading', { name: 'Peito', exact: true })).toBeVisible();
    if (destination === 'Histórico') await expect(page.getByText('Nenhuma sessão ainda', { exact: true })).toBeVisible();
    await expect(page.getByTestId('start-workout')).toHaveCount(destination === 'Treino' ? 1 : 0);
  }
  expect(await readState(page)).toEqual(pinned);
});

for (const action of [
  'Agora não',
  'Continuar treino de sábado, 5 de setembro',
  'Encerrar treino de sábado, 5 de setembro e começar hoje',
]) {
  test('sessão anterior exige decisão explícita: ' + action, async ({ page }) => {
    const previous = {
      ...createQuickSession('Ontem', yesterday, () => 'previous'),
      exercises: [{
        id: 'previous-exercise', order: 0, planned: null, performed: toSnapshot(FALLBACK_EXERCISES[0]), status: 'added' as const,
        sets: [{ id: 'previous-set', index: 1, kg: 60, reps: 8, savedAt: yesterday.toISOString() }]
      }],
    };
    const state: AppState = { ...pinned, sessions: [previous] };
    await openApp(page, state);
    await page.getByTestId('start-workout').click();
    const dialog = page.getByRole('dialog', { name: 'Treino anterior ainda aberto', exact: true });
    await expect(dialog).toBeVisible();
    expect(await readState(page)).toEqual(state);
    await dialog.getByRole('button', { name: action, exact: true }).last().click();
    await expect(dialog).toHaveCount(0);
    if (action === 'Encerrar treino de sábado, 5 de setembro e começar hoje') {
      await expect.poll(async () => (await readState(page)).sessions.length).toBe(2);
      const sessions = (await readState(page)).sessions;
      expect(sessions[0]).toEqual({ ...previous, state: 'completed', completedAt: now.toISOString() });
      expect(sessions[1]).toMatchObject({ sourcePlanId: plan.id, startedAt: now.toISOString(), state: 'in_progress' });
    } else {
      expect(await readState(page)).toEqual(state);
      if (action === 'Continuar treino de sábado, 5 de setembro') await expect(page.getByRole('heading', { name: 'Ontem', exact: true })).toBeVisible();
      else await expect(page.getByTestId('start-workout')).toHaveText('Começar');
    }
  });
}

test('ficha: pular, trocar, adicionar, recarregar e finalizar o mesmo ID', async ({ page }) => {
  const twoExercisePlan: Plan = {
    ...plan,
    exercises: [
      plan.exercises[0],
      { ...plan.exercises[0], id: 'plan-exercise-2', order: 1, exercise: { ...toSnapshot(FALLBACK_EXERCISES[1]), images: [] } },
    ],
  };
  await openApp(page, { plans: [twoExercisePlan], sessions: [], todayPin: { kind: 'plan', id: twoExercisePlan.id } });
  await page.getByTestId('start-workout').click();
  await expect(page.getByRole('heading', { name: 'Peito', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pular', exact: true })).toBeVisible();
  await expect(page.locator('.session-clock, .progress-track, .status-chip')).toHaveCount(0);
  await expect(page.getByText('Feito', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Pular', exact: true }).click();
  await page.getByRole('button', { name: 'Trocar', exact: true }).click();
  const swapPicker = page.getByRole('dialog', { name: 'Trocar exercício' });
  await swapPicker.locator('button.picker-item').nth(2).click();
  await page.getByLabel('Peso em quilogramas').fill('30');
  await page.getByLabel('Repetições', { exact: true }).fill('8');
  await page.getByTestId('quick-set-done').click();
  await page.getByRole('button', { name: 'Adicionar exercício', exact: true }).click();
  const addPicker = page.getByRole('dialog', { name: 'Adicionar na sessão' });
  await addPicker.locator('button.picker-item').nth(3).click();
  await page.getByLabel('Peso em quilogramas').fill('12');
  await page.getByLabel('Repetições', { exact: true }).fill('10');
  await page.getByTestId('quick-set-done').click();
  await expect.poll(async () => (await readState(page)).sessions[0]?.exercises.map((exercise) => exercise.status)).toEqual(['skipped', 'swapped', 'added']);
  const recorded = (await readState(page)).sessions[0];
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await page.reload();
  await page.getByTestId('start-workout').click();
  expect((await readState(page)).sessions).toEqual([recorded]);
  await page.getByTestId('finish-workout').click();
  await expect.poll(async () => (await readState(page)).sessions[0]?.state).toBe('completed');
  const completed = (await readState(page)).sessions[0];
  expect(completed.id).toBe(recorded.id);
  expect(completed.exercises.map((exercise) => exercise.status)).toEqual(['skipped', 'swapped', 'added']);
  expect(completed.exercises[1].sets[0]).toMatchObject({ kg: 30, reps: 8 });
  expect(completed.exercises[2].sets[0]).toMatchObject({ kg: 12, reps: 10 });
});

test('sessão concluída permanece intacta ao começar outro treino com ficha', async ({ page }) => {
  const completed = { ...createSessionFromPlan(plan, now, () => 'completed'), state: 'completed' as const, completedAt: now.toISOString() };
  await openApp(page, { ...pinned, sessions: [completed] });
  await expect(page.getByTestId('start-workout')).toHaveText('Começar');
  await page.getByTestId('start-workout').click();
  await expect.poll(async () => (await readState(page)).sessions.length).toBe(2);
  const sessions = (await readState(page)).sessions;
  expect(sessions[0]).toEqual(completed);
  expect(sessions[1].id).not.toBe(completed.id);
});

for (const variant of ['livre', 'fixada', 'retomada', 'menu'] as const) {
  test('composição mobile: ' + variant, async ({ page }, info) => {
    const session = createQuickSession('Treino de hoje', now, () => 'today-session');
    const state = variant === 'livre' ? empty : variant === 'retomada'
      ? { ...empty, sessions: [session], todayPin: { kind: 'session' as const, id: session.id } } : pinned;
    await openApp(page, state);
    await expect(page.locator('.essential-date')).toHaveText('Domingo, 6 de setembro');
    await expect(page.locator('.bottom-nav, .workout-dock, .today-progress, .last-session-row, .online-pill')).toHaveCount(0);
    if (variant === 'menu') {
      await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
    } else {
      await expect(page.locator('main button')).toHaveCount(variant === 'retomada' ? 1 : 2);
    }
    await capture(page, info, 'essencial-' + variant);
  });
}

test('nome longo, texto a 200%, contraste, alvos e menu em 320px e desktop', async ({ page }, info) => {
  const longPlan = { ...plan, name: 'Peito, ombros e tríceps — treino completo com exercícios complementares' };
  await openApp(page, { ...pinned, plans: [longPlan] });
  for (const width of [320, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    for (const fontSize of ['100%', '200%']) {
      await page.evaluate((value) => { document.documentElement.style.fontSize = value; }, fontSize);
      await expect(page.getByRole('button', { name: 'Escolher ficha: ' + longPlan.name, exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      for (const button of await page.locator('.essential-header button, .essential-main button').all()) {
        const box = await button.boundingBox();
        expect(box!.width).toBeGreaterThanOrEqual(48);
        expect(box!.height).toBeGreaterThanOrEqual(48);
      }
      const start = await page.getByTestId('start-workout').boundingBox();
      expect(start!.height).toBeGreaterThanOrEqual(52);
      const title = await page.locator('main h1').boundingBox();
      expect(start!.y).toBeGreaterThanOrEqual(title!.y + title!.height);
      if (width === 1280) expect((await page.locator('main').boundingBox())!.width).toBeLessThanOrEqual(560);
      await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
      const dialog = page.getByRole('dialog', { name: 'GymSheet', exact: true });
      await expect(dialog).toBeVisible();
      for (const button of await dialog.getByRole('button').all()) {
        const box = await button.boundingBox();
        expect(box!.width).toBeGreaterThanOrEqual(48);
        expect(box!.height).toBeGreaterThanOrEqual(48);
      }
      expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
      await capture(page, info, 'essencial-menu-' + width + '-' + fontSize.replace('%', ''));
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
    }
  }
  const contrast = await page.evaluate(() => {
    const luminance = (color: string) => {
      const rgb = color.match(/[\d.]+/g)!.slice(0, 3).map(Number).map((v) => v / 255).map((v) => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
      return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
    };
    const ratio = (a: string, b: string) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05);
    const background = getComputedStyle(document.querySelector('.essential-home')!).backgroundColor;
    const date = getComputedStyle(document.querySelector('.essential-date')!);
    const button = getComputedStyle(document.querySelector('.essential-start')!);
    return { text: ratio(date.color, background), buttonText: ratio(button.color, button.backgroundColor), control: ratio(button.backgroundColor, background) };
  });
  expect(contrast.text).toBeGreaterThanOrEqual(4.5);
  expect(contrast.buttonText).toBeGreaterThanOrEqual(4.5);
  expect(contrast.control).toBeGreaterThanOrEqual(3);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
  await expect(page.locator('.essential-menu')).toHaveCSS('transition-duration', '0s');
  await expect(page.locator('.essential-menu-overlay')).toHaveCSS('transition-duration', '0s');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Abrir menu', exact: true })).toBeFocused();
});

test('catálogo indisponível mantém aviso e status acessível em Dados', async ({ page }, info) => {
  await openApp(page, undefined, true);
  await expect(page.getByText('Catálogo offline.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tentar', exact: true })).toBeVisible();
  await goTo(page, 'Dados e backup');
  await expect(page.getByRole('heading', { name: 'Dados', exact: true })).toBeVisible();
  await expect(page.getByText('Seu histórico é seu')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Catálogo de exercícios', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Baixar JSON', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Baixar CSV', exact: true })).toBeVisible();
  await expect(page.getByText('Restaurar substitui os dados deste aparelho.', { exact: true })).toBeVisible();
  await capture(page, info, 'essencial-dados');
});
