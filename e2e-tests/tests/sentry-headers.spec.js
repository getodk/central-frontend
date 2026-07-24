import { expect } from '@playwright/test';
import { test } from '../util';

const appUrl = process.env.ODK_URL;

test.describe('Sentry request headers', () => {
  test('does not attach sentry-trace or baggage header to requests', async ({ allowedLogs, page }) => {
    allowedLogs.push((msg, text) => text.includes('401') && msg.location().url.includes('/v1/'));

    await page.route('**/client-config.json', r => r.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ sentryDsn: 'https://public@o0.ingest.sentry.io/0' }),
    }));
    await page.route('**/*.ingest.sentry.io/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
    await page.route('**/v1/**', r => r.fulfill({ status: 401, contentType: 'application/json', body: '{}' }));
    // Must return 200 or the app shows "Error Loading Central".
    await page.route('**/v1/config/public', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));

    let v1RequestCount = 0;
    const violations = [];
    page.on('request', request => {
      const url = request.url();
      if (!url.includes('/v1/')) {
        return;
      }
      v1RequestCount++;
      const { 'sentry-trace': trace, baggage } = request.headers();
      if (trace || baggage) {
        violations.push({ url, 'sentry-trace': trace, baggage });
      }
    });

    await page.goto(appUrl);
    await expect(page.getByRole('heading', { name: 'Welcome to ODK Central' })).toBeVisible();
    await page.waitForLoadState('networkidle', { timeout: 5000 });

    expect(v1RequestCount, 'no /v1/ requests observed').toBeGreaterThan(0);
    expect(violations, 'Sentry must not inject trace headers into outgoing requests').toEqual([]);
  });
});
