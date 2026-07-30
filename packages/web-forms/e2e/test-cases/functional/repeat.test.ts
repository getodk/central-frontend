import { expect, test } from '@playwright/test';
import { FillFormPage } from '../../page-objects/pages/FillFormPage.ts';

test.describe('Repeats', () => {
  let formPage: FillFormPage;

  test.beforeEach(async ({ page }) => {
    formPage = await FillFormPage.loadForm(page, '01-basic-repeat.xml');
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
