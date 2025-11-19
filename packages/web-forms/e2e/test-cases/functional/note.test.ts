import { test } from '@playwright/test';
import { FillFormPage } from '../../page-objects/pages/FillFormPage.ts';
import { PreviewPage } from '../../page-objects/pages/PreviewPage.ts';

test.describe('Note Question Type', () => {
	let formPage: FillFormPage;

	test.beforeEach(async ({ page }) => {
		formPage = new FillFormPage(page);

		const previewPage = new PreviewPage(page);
		await previewPage.goToDevPage();
		await previewPage.openDevDemoForm('notes', '2-all-possible-notes.xml', 'Notes');
	});

	test('renders all possible note types', async ({ context }) => {
		await context.setGeolocation({
			latitude: 40.7128,
			longitude: -74.006,
			accuracy: 10,
			altitude: 0,
		});

		await formPage.text.expectLabel(`
		This form illustrates the note concept in ODK. This is not a concept that exists in
          the underlying ODK XForms spec, it's introduced by XLSForm and discussed informally.
          Typically a note only has a label.
		`);

		await formPage.text.expectLabel('A note with a hint');
		await formPage.text.expectHint('This is a hint');

		// Hint only, no label.
		await formPage.text.expectLabelAtIndex('', 2, false);
		await formPage.text.expectHintAtIndex('Hint-only note', 1);

		await formPage.text.expectLabel('A note with a default value');
		await formPage.text.expectNoteAtIndex('A value', 0);

		await formPage.text.expectLabel('A note with a calculation');
		await formPage.text.expectNoteAtIndex('A value', 1);

		await formPage.text.expectLabel('A readonly integer with value');
		await formPage.text.expectNoteAtIndex('3', 2);

		await formPage.text.expectLabel('A note with decimal type calculated from int');
		await formPage.text.expectNoteAtIndex('4.5', 3);

		await formPage.text.expectLabel('A note with geopoint type');
		await formPage.geopoint.expectGeopointFormattedValue([
			'Accuracy: 150 m',
			'Latitude: 38.253094215699576',
			'Longitude: 21.756382658677467',
		]);
	});
});
