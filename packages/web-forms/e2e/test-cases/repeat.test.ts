import { expect, test } from '@playwright/test';
import { FillFormPage } from '../page-objects/pages/FillFormPage.ts';
import { PreviewPage } from '../page-objects/pages/PreviewPage.ts';

test.describe('Repeats', () => {
	let formPage: FillFormPage;

	test.beforeEach(async ({ page }) => {
		formPage = new FillFormPage(page);

		const previewPage = new PreviewPage(page);
		await previewPage.goToDevPage();
		await previewPage.openDevDemoForm('repeats', '01-basic-repeat.xml', 'Repeat (basic)');
	});

	test('renders one instance by default', async () => {
		const instances = await formPage.repeat.getInstancesHeader();
		expect(instances?.length).toBe(1);

		await formPage.repeat.expectInstanceHeader(instances[0], 'Repeat Item', '1');
		await formPage.text.expectLabel('Repeat input a');
	});

	test('adds instances', async () => {
		await formPage.repeat.addInstance('Add');

		const instances = await formPage.repeat.getInstancesHeader();
		expect(instances?.length).toBe(2);

		await formPage.repeat.expectInstanceHeader(instances[0], 'Repeat Item', '1');
		await formPage.repeat.expectInstanceHeader(instances[1], 'Repeat Item', '2');

		await formPage.repeat.addInstance('Add');
		const udpatedInstances = await formPage.repeat.getInstancesHeader();
		expect(udpatedInstances?.length).toBe(3);

		await formPage.repeat.expectInstanceHeader(udpatedInstances[2], 'Repeat Item', '3');
	});
});
