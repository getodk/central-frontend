import { expect, Page } from '@playwright/test';

const NEXT = 'Next';
const PREVIOUS = 'Previous';

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
    await this.clickButton(PREVIOUS);
  }

  async expectNavigation({ previous, next }: NavigationState) {
    const previousButton = this.button(PREVIOUS);
    const nextButton = this.button(NEXT);

    await expect(previousButton).toBeVisible();
    await expect(nextButton).toBeVisible();
    await expect(previousButton).toBeEnabled({ enabled: previous });
    await expect(nextButton).toBeEnabled({ enabled: next });
  }
}
