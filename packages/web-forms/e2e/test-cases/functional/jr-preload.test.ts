import { expect, test } from '@playwright/test';
import { FillFormPage } from '../../page-objects/pages/FillFormPage.js';
import { PreviewPage } from '../../page-objects/pages/PreviewPage.js';

const DEVICE_ID_REGEX =
	/^getodk\.org:webforms:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const INSTANCE_ID_REGEX =
	/^uuid:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

test.describe('jr:preload', () => {
	let formPage: FillFormPage;
	let start: number;

	const getStartOfDay = (date: number) => {
		const newDate = new Date(date);
		newDate.setHours(0, 0, 0, 0);
		return newDate.valueOf();
	};

	test.beforeEach(async ({ page }) => {
		formPage = new FillFormPage(page);

		start = Date.now();

		const previewPage = new PreviewPage(page);
		await previewPage.goToDevPage();
		await previewPage.openDevDemoForm('test-javarosa', 'preload.xml', 'jr:preload');
	});

	test('binds properties', async () => {
		const end = Date.now();

		const todayDateTime = getStartOfDay(Date.parse(await formPage.note.getValue('today')));
		expect(todayDateTime).toBeGreaterThanOrEqual(getStartOfDay(start));
		expect(todayDateTime).toBeLessThanOrEqual(getStartOfDay(end));

		const startDateTime = Date.parse(await formPage.note.getValue('start'));
		expect(startDateTime).toBeGreaterThanOrEqual(start);
		expect(startDateTime).toBeLessThanOrEqual(end);

		await formPage.note.expectValueToBeEmpty('end'); // end isn't populated on load

		const deviceID = await formPage.note.getValue('deviceid');
		expect(deviceID).toMatch(DEVICE_ID_REGEX);

		const instanceID = await formPage.note.getValue('instanceID');
		expect(instanceID).toMatch(INSTANCE_ID_REGEX);

		// the phonenumber, email, and username are passed in from the demo app
		await formPage.note.expectValue('phonenumber', '+1235556789');
		await formPage.note.expectValue('email', 'fake@fake.fake');
		await formPage.note.expectValue('username', 'nousername');

		await formPage.reload();

		// assert the deviceid hasn't changed - should be loaded from localstorage
		await formPage.note.expectValue('deviceid', deviceID);

		// assert the instanceID HAS changed
		const newInstanceID = await formPage.note.getValue('instanceID');
		expect(newInstanceID).not.toMatch(instanceID);
	});
});
