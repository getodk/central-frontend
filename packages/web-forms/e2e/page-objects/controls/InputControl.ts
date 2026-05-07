import { expect, Page } from '@playwright/test';

export class InputControl {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	async getInputByLabel(label: string) {
		const input = this.page.locator(
			`.question-container:has(.control-text label:text-is("${label}")) input`
		);

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
