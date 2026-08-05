import { test } from '@playwright/test';
import {
  loginAsAdmin,
  saveScreenshot,
  createTestPrototype,
  configureRuntimeServerForTests,
  setPrototypeCodeViaApi,
  goToPrototypeCodeTab,
  waitForRuntimeReady,
  runPrototype,
  expectRuntimeLogContains,
} from './helpers';

test.describe('Prototype Runtime', () => {
  test('run prototype code and show output in runtime terminal', async ({ page }) => {
    test.setTimeout(120000);

    const timestamp = Date.now();
    const protoName = `RuntimeRun_${timestamp}`;
    const outputMarker = `E2E_RUNTIME_${timestamp}`;

    await loginAsAdmin(page);
    await configureRuntimeServerForTests(page);

    const { modelId, prototypeId } = await createTestPrototype(page, protoName);
    await setPrototypeCodeViaApi(page, prototypeId, `print("${outputMarker}")\n`);

    await goToPrototypeCodeTab(page, modelId, prototypeId);
    await page.reload();
    await page.waitForTimeout(4000);

    await waitForRuntimeReady(page);
    await runPrototype(page);
    await expectRuntimeLogContains(page, outputMarker);

    await saveScreenshot(page, 'proto-runtime-output');
  });
});
