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
  isRuntimeServerReachable,
  RUNTIME_SERVER_URL,
} from './helpers';

test.describe('Prototype Runtime', () => {
  test('run prototype code and show output in runtime terminal', async ({ page }) => {
    test.setTimeout(120000);

    const reachable = await isRuntimeServerReachable(page);
    test.skip(!reachable, `kit-manager not reachable at ${RUNTIME_SERVER_URL}`);

    const timestamp = Date.now();
    const protoName = `RuntimeRun_${timestamp}`;
    const outputMarker = `E2E_RUNTIME_${timestamp}`;

    await loginAsAdmin(page);
    await configureRuntimeServerForTests(page);

    const { modelId, prototypeId } = await createTestPrototype(page, protoName);
    await setPrototypeCodeViaApi(page, prototypeId, `print("${outputMarker}")\n`);

    await goToPrototypeCodeTab(page, modelId, prototypeId);

    await waitForRuntimeReady(page);
    await runPrototype(page);
    await expectRuntimeLogContains(page, outputMarker);

    await saveScreenshot(page, 'proto-runtime-output');
  });
});
