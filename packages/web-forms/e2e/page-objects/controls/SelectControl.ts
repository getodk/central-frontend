import { Page } from '@playwright/test';

const ANIMATION_TIME = 50;

export class SelectControl {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	async selectMultiDropdownOption(locator: string, ...labels: string[]) {
		const container = this.page.locator(locator);
		const dropdown = container.locator('.multi-select-dropdown');
		await dropdown.click();
		for (const label of labels) {
			await this.page.locator(`.p-multiselect-option:has-text("${label}")`).click();
		}
		await this.page.waitForTimeout(ANIMATION_TIME);
	}

	async selectDropdownOption(locator: string, label: string) {
		const container = this.page.locator(locator);
		const dropdown = container.locator('.dropdown');
		await dropdown.click();
		await this.page.locator(`.p-select-option:has-text("${label}")`).click();
		await this.page.waitForTimeout(ANIMATION_TIME);
	}
}
