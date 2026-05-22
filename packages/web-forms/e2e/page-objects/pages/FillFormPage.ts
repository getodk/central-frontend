import { Page } from '@playwright/test';
import { GeopointControl } from '../controls/GeopointControl.js';
import { InputControl } from '../controls/InputControl.js';
import { MapControl } from '../controls/MapControl.js';
import { NoteControl } from '../controls/NoteControl.js';
import { RepeatControl } from '../controls/RepeatControl.js';
import { SelectControl } from '../controls/SelectControl.js';
import { TextControl } from '../controls/TextControl.js';

export class FillFormPage {
	private readonly page: Page;

	public readonly geopoint: GeopointControl;
	public readonly input: InputControl;
	public readonly map: MapControl;
	public readonly repeat: RepeatControl;
	public readonly text: TextControl;
	public readonly select: SelectControl;
	public readonly note: NoteControl;

	constructor(page: Page) {
		this.page = page;

		this.geopoint = new GeopointControl(page);
		this.input = new InputControl(page);
		this.map = new MapControl(page);
		this.repeat = new RepeatControl(page);
		this.text = new TextControl(page);
		this.select = new SelectControl(page);
		this.note = new NoteControl(page);
	}

	async copyToClipboard(valueToCopy: string) {
		await this.page.evaluate((value) => {
			return navigator.clipboard.writeText(value);
		}, valueToCopy);
	}

	async waitForNetworkIdle() {
		return this.page.waitForLoadState('networkidle');
	}

	async reload() {
		await this.page.reload();
	}
}
