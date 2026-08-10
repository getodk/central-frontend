import { expect, Locator, Page } from '@playwright/test';

export class RepeatControl {
  private readonly SELECTOR_INSTANCE = '.is-repeat';
  private readonly SELECTOR_HEADER = '.p-panel-header';
  private readonly SELECTOR_ADD_BUTTON = '.button-add-instance';
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  private addButton(label?: string) {
    const button = this.page.locator(this.SELECTOR_ADD_BUTTON);

    return label == null ? button : button.filter({ hasText: label });
  }

  async getInstancesHeader(): Promise<Locator[]> {
    return this.page.locator(`${this.SELECTOR_INSTANCE} ${this.SELECTOR_HEADER}`).all();
  }

  async expectInstanceHeader(instance: Locator, expectedTitle: string, expectedCount: string) {
    const title = instance.getByText(expectedTitle, { exact: true });
    await expect(title).toBeVisible();
    const count = instance.getByText(expectedCount, { exact: true });
    await expect(count).toBeVisible();
  }

  async addInstance(label?: string) {
    const button = this.addButton(label);
    await expect(button).toBeVisible();
    await button.click();
  }

  async expectAddButtonVisible(visible: boolean, label?: string) {
    if (visible) {
      await expect(this.addButton(label)).toBeVisible();
      return;
    }

    await expect(this.addButton(label)).toHaveCount(0);
  }
}
