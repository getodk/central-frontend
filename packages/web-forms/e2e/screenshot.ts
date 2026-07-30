import { expect, Locator, Page } from '@playwright/test';

interface ScreenshotParams {
  page: Page;
  locator: Locator;
  screenshotName: string;
  width: number;
  height: number;
  animationTime?: number;
}

export const expectScreenshot = async (params: ScreenshotParams) => {
  const browserName = params.page.context().browser()?.browserType().name();
  const isChromiumLinux = process.platform === 'linux' && browserName === 'chromium';

  if (isChromiumLinux) {
    // Chrome for Linux has an issue when taking the snapshot (ref. https://github.com/microsoft/playwright/issues/18827)
    const styleContent = [
      `width: ${params.width}px !important`,
      `height: ${params.height}px !important`,
      `max-width: ${params.width}px !important`,
      `max-height: ${params.height + 1}px !important`,
    ].join(';');
    await params.locator.evaluate((element, style) => {
      element.style.setProperty('style', style);
    }, styleContent);

    await params.page.addStyleTag({
      content: `
      body, html {
        overflow: hidden !important;
      }
    `,
    });

    if (params.animationTime) {
      await params.page.waitForTimeout(params.animationTime);
    }
  }

  await expect(params.locator).toHaveScreenshot(params.screenshotName, {
    maxDiffPixelRatio: 0.02,
  });
};
