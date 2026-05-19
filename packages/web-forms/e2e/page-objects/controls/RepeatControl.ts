import { expect, Locator, Page } from '@playwright/test';

export class RepeatControl {
	private readonly SELECTOR_INSTANCE = '.is-repeat';
	private readonly SELECTOR_HEADER = '.p-panel-header';
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
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

	async addInstance(buttonLabel: string) {
		const button = this.page
			.locator(`${this.SELECTOR_INSTANCE} + button`)
			.getByText(buttonLabel, { exact: true });
		await expect(button).toBeVisible();
		await button.click();
	}
}
