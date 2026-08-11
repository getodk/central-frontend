import { expect, Page } from '@playwright/test';

const NEXT = 'Next';
const BACK = 'Back';
const SEND = 'Send';

interface NavigationState {
  previous: boolean;
  next: boolean;
}

export class PaginationControl {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  private button(name: string) {
    return this.page.getByRole('button', { name, exact: true });
  }

  private async clickButton(name: string) {
    const button = this.button(name);
    await expect(button).toBeEnabled();
    await button.click();
  }

  async clickNext() {
    await this.clickButton(NEXT);
  }

  async clickPrevious() {
    await this.clickButton(BACK);
  }

  async expectNavigation({ previous, next }: NavigationState) {
    await expect(this.button(BACK)).toBeVisible({ visible: previous });
    await expect(this.button(NEXT)).toBeVisible({ visible: next });
    await expect(this.button(SEND)).toBeVisible({ visible: !next });
  }
}
