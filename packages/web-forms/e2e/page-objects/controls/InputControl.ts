import { expect, Page } from '@playwright/test';

export class InputControl {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	private async getInputByLabel(label: string) {
		const container = this.page
			.locator('.question-container')
			.filter({ has: this.page.locator(`.control-text label:text-is("${label}")`) });

		const input = container.locator('input');

		await expect(input, `Input for label "${label}" not found`).toBeVisible();
		await input.scrollIntoViewIfNeeded();

		return input;
	}

	async fillAndExpectInputValue(label: string, value: string, expectedDisplayedValue: string) {
		const input = await this.getInputByLabel(label);
		await input.clear();
		await input.fill(value);

		await expect(input, `Input for label "${label}" does not have expected value`).toHaveValue(
			expectedDisplayedValue
		);
	}

	/**
	 * Slower than fillAndExpectInputValue, but certain PrimeVue inputs
	 * (such as InputNumber) respond to keypress events.
	 */
	async typeAndExpectInputValue(label: string, value: string, expectedDisplayedValue: string) {
		const input = await this.getInputByLabel(label);
		await input.clear();
		await input.pressSequentially(value);

		await expect(input, `Input for label "${label}" does not have expected value`).toHaveValue(
			expectedDisplayedValue
		);
	}

	async pasteAndExpectInputValue(label: string, expectedDisplayedValue: string) {
		const input = await this.getInputByLabel(label);
		await input.clear();
		await input.focus();
		await this.page.keyboard.press(`${process.platform === 'darwin' ? 'Meta' : 'Control'}+KeyV`);

		await expect(input, `Input for label "${label}" does not have expected value`).toHaveValue(
			expectedDisplayedValue
		);
	}
}
