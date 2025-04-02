import { expect, Page } from '@playwright/test';

export class GeopointControl {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	async expectGeopointDialog(expectedTitle: string, expectedQualityText: string) {
		const dialogTitle = this.page
			.locator('.geo-dialog-header-title')
			.getByText(expectedTitle, { exact: true });
		await expect(dialogTitle).toBeVisible();

		const accuracyQuality = this.page
			.locator('.geopoint-information .geo-quality')
			.getByText(expectedQualityText, { exact: true });
		await expect(accuracyQuality).toBeVisible();
	}

	async expectGeopointFormattedValue(expectedLocation: string[], expectedQuality?: string) {
		for (const location of expectedLocation) {
			const formattedValue = this.page
				.locator('.geopoint-formatted-value')
				.getByText(location, { exact: true });
			await expect(formattedValue).toBeVisible();
		}

		if (expectedQuality) {
			const quality = this.page
				.locator('.geopoint-value .geo-quality')
				.getByText(expectedQuality, { exact: true });
			await expect(quality).toBeVisible();
		}
	}

	async expectGeopointErrorMessage(expectedMessage: string[]) {
		const message = this.page
			.locator('.geopoint-error')
			.getByText(expectedMessage, { exact: true });
		await expect(message).toBeVisible();
	}

	async openDialog(index = 0) {
		const buttons = this.page
			.locator('.geopoint-control')
			.getByText('Get location', { exact: true });
		const button = buttons.nth(index);
		await button.scrollIntoViewIfNeeded();
		await expect(button).toBeVisible();
		await button.click();
	}

	async saveLocation() {
		const button = this.page
			.locator('.geo-dialog-footer')
			.getByText('Save location', { exact: true });
		await expect(button).toBeVisible();
		await button.click();
	}

	async retryCapture() {
		const button = this.page.locator('.geopoint-value').getByText('Try again', { exact: true });
		await expect(button).toBeVisible();
		await button.click();
	}
}
