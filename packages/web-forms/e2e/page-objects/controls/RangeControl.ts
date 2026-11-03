import { expect, Locator, Page } from '@playwright/test';

export class RangeControl {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  getRangeContainer(label: string): Locator {
    return this.page.locator(`.question-container:has(.control-text label:text-is("${label}"))`);
  }

  // Clicks the tick of the value, then removes focus so no outline is captured.
  async selectValue(label: string, value: number) {
    const container = this.getRangeContainer(label);
    await container.locator(`.range-tick[data-value="${value}"]`).click();
    await container.locator('.range-slider').blur();
    await expect(container.locator('.range-value')).toHaveText(String(value));
  }
}
