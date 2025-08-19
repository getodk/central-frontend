import { Page } from '@playwright/test';
import { GeopointControl } from '../controls/GeopointControl.js';
import { InputControl } from '../controls/InputControl.js';
import { RepeatControl } from '../controls/RepeatControl.js';
import { TextControl } from '../controls/TextControl.js';

export class FillFormPage {
	private readonly page: Page;

	public readonly geopoint: GeopointControl;
	public readonly repeat: RepeatControl;
	public readonly text: TextControl;
	public readonly input: InputControl;

	constructor(page: Page) {
		this.page = page;

		this.geopoint = new GeopointControl(page);
		this.repeat = new RepeatControl(page);
		this.text = new TextControl(page);
		this.input = new InputControl(page);
	}

	async copyToClipboard(valueToCopy: string) {
		await this.page.evaluate((value) => {
			return navigator.clipboard.writeText(value);
		}, valueToCopy);
	}
}
