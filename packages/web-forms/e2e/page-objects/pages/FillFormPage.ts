import { expect, Page } from '@playwright/test';
import { GeopointControl } from '../controls/GeopointControl.js';

export class FillFormPage {
	private readonly page: Page;

	public readonly geopoint: GeopointControl;

	constructor(page: Page) {
		this.page = page;
		this.geopoint = new GeopointControl(page);
	}

	private async expectTextAtIndex(
		locator: string,
		expectedText: string,
		index: number,
		expectVisible = true
	) {
		const texts = this.page.locator(locator);
		const text = texts.nth(index).getByText(expectedText, { exact: true });

		if (expectVisible) {
			await text.scrollIntoViewIfNeeded();
			return expect(text).toBeVisible();
		}

		return expect(text).not.toBeVisible();
	}

	private async expectText(locator: string, expectedText: string) {
		const text = this.page.locator(locator).getByText(expectedText, { exact: true });
		await text.scrollIntoViewIfNeeded();
		await expect(text).toBeVisible();
	}

	async expectNoteAtIndex(expectedNoteText: string, index: number, expectVisible?: boolean) {
		await this.expectTextAtIndex(
			'.note-control .note-value',
			expectedNoteText,
			index,
			expectVisible
		);
	}

	async expectNote(expectedNoteText: string) {
		await this.expectText('.note-control .note-value', expectedNoteText);
	}

	async expectLabelAtIndex(expectedLabelText: string, index: number, expectVisible?: boolean) {
		await this.expectTextAtIndex('.control-text label', expectedLabelText, index, expectVisible);
	}

	async expectLabel(expectedLabelText: string) {
		await this.expectText('.control-text label', expectedLabelText);
	}

	async expectHintAtIndex(expectedHintText: string, index: number, expectVisible?: boolean) {
		await this.expectTextAtIndex('.control-text .hint', expectedHintText, index, expectVisible);
	}

	async expectHint(expectedHintText: string) {
		await this.expectText('.control-text .hint', expectedHintText);
	}
}
