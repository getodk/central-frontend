import { expect, Locator, Page } from '@playwright/test';

interface ScreenshotParams {
  page: Page;
  locator: Locator;
  screenshotName: string;
  width: number;
  height: number;
}

const MAX_DIFF_PIXEL_RATIO = 0.001;

const getBox = async (locator: Locator, screenshotName: string) => {
  const box = await locator.boundingBox();
  if (box == null) {
    throw new Error(`Cannot take screenshot ${screenshotName}: element is not visible`);
  }
  return box;
};

// Moves the page up and left by the element's fractional offset, aligning it to
// whole pixels and keeping its rendered size and edges consistent.
const snapToPixelGrid = async (page: Page, box: { x: number; y: number }) => {
  const shift = {
    x: Math.floor(box.x) - box.x,
    y: Math.floor(box.y) - box.y,
  };

  await page.evaluate(({ x, y }) => {
    const { style } = document.body;
    style.position = 'relative';
    style.left = `${parseFloat(style.left || '0') + x}px`;
    style.top = `${parseFloat(style.top || '0') + y}px`;
  }, shift);
};

// Parks the pointer in the viewport corner so nothing is captured in its hover state.
const parkPointer = (page: Page) => page.mouse.move(0, 0);

// Headed Chromium on Linux shows page scrollbars, which narrow the layout and get captured.
const hidePageScrollbars = (page: Page) => {
  return page.evaluate(() => {
    [document.documentElement, document.body].forEach((element) => {
      element.style.setProperty('overflow', 'hidden', 'important');
    });
  });
};

const prepareCapture = async (page: Page) => {
  await hidePageScrollbars(page);
  await parkPointer(page);
};

export const expectFullScreenScreenshot = async (
  page: Page,
  locator: Locator,
  screenshotName: string
) => {
  // A full screen element already sits on the pixel grid, so it is captured directly.
  await prepareCapture(page);
  await expect(locator).toHaveScreenshot(screenshotName, {
    maxDiffPixelRatio: MAX_DIFF_PIXEL_RATIO,
  });
};

export const expectFullPageScreenshot = async (page: Page, screenshotName: string) => {
  await prepareCapture(page);
  await expect(page).toHaveScreenshot(screenshotName, {
    fullPage: true,
    maxDiffPixelRatio: MAX_DIFF_PIXEL_RATIO,
  });
};

const isBelowViewport = (page: Page, box: { y: number }, height: number) => {
  const viewport = page.viewportSize();
  if (viewport == null) {
    return false;
  }

  const bottom = box.y + height;
  return bottom > viewport.height;
};

const getScrollOffset = (page: Page) =>
  page.evaluate(() => ({ x: window.scrollX, y: window.scrollY }));

export const expectScreenshot = async (params: ScreenshotParams) => {
  const { page, locator, screenshotName, height, width } = params;
  await prepareCapture(page);
  await locator.scrollIntoViewIfNeeded();
  const firstBox = await getBox(locator, screenshotName);
  const isFullPage = isBelowViewport(page, firstBox, height);
  const scroll = isFullPage ? await getScrollOffset(page) : { x: 0, y: 0 };

  // A full page capture positions the element by its page offset, a viewport capture by its viewport offset.
  await snapToPixelGrid(page, { x: firstBox.x + scroll.x, y: firstBox.y + scroll.y });
  const box = await getBox(locator, screenshotName);

  await expect(page).toHaveScreenshot(screenshotName, {
    fullPage: isFullPage,
    clip: {
      x: Math.round(box.x + scroll.x),
      y: Math.round(box.y + scroll.y),
      width,
      height,
    },
    maxDiffPixelRatio: MAX_DIFF_PIXEL_RATIO,
  });
};
