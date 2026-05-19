import { expect, Page } from '@playwright/test';

export class NoteControl {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	getNoteContainer(label: string) {
		return this.page.locator(`.question-container:has(.control-text label:text-is("${label}"))`);
	}

	async getNoteByLabel(label: string) {
		const noteContainer = this.getNoteContainer(label);
		const noteValue = noteContainer.locator('.note-value');
		await expect(noteValue, `Note for label "${label}" not found`).toBeVisible();
		await noteValue.scrollIntoViewIfNeeded();
		return noteValue;
	}

	async getValue(label: string) {
		const note = await this.getNoteByLabel(label);
		return await note.innerText();
	}

	async expectValue(label: string, value: string) {
		const note = await this.getNoteByLabel(label);
		await expect(note, `Input for label "${label}" does not have expected value`).toHaveText(value);
	}

	async expectValueToBeEmpty(label: string) {
		const noteContainer = this.getNoteContainer(label);
		await expect(noteContainer).toBeVisible();
		await expect(noteContainer.locator('.note-value')).not.toBeVisible();
	}
}
