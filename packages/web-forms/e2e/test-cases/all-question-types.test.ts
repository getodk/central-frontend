import { Locator, test } from '@playwright/test';
import { BrowserContext } from 'playwright-core';
import { FillFormPage } from '../page-objects/pages/FillFormPage.ts';
import { PreviewPage } from '../page-objects/pages/PreviewPage.ts';

/**
 * Tests the UI functionality of all question types in the "All Question Types" form,
 * including rendering, user input, and validation.
 */
test.describe('All Question Types', () => {
	let formPage: FillFormPage;
	let context: BrowserContext;

	/**
	 * Opens the form once and runs all test cases to optimize suite execution speed.
	 */
	test.beforeAll(async ({ browser }) => {
		const permissions = ['geolocation'];
		if (browser.browserType().name() === 'chromium') {
			permissions.push('clipboard-write');
		}

		context = await browser.newContext({
			geolocation: { latitude: -28.996, longitude: 134.762 }, // South Australia,
			permissions: permissions,
		});
		const page = await context.newPage();
		const previewPage = new PreviewPage(page);
		await previewPage.goToDevPage();

		const newPage = await previewPage.openPublicDemoForm(
			'All question types',
			'All question types'
		);
		formPage = new FillFormPage(newPage);
	});

	test.afterAll(async () => {
		await context?.close();
	});

	test.describe('Text Question Types', () => {
		test.describe('String type', () => {
			const questionLabel = 'String';

			test('allows all characters and long values', async () => {
				await formPage.input.fillAndExpectInputValue(questionLabel, '-123.098,56', '-123.098,56');
				await formPage.input.fillAndExpectInputValue(
					questionLabel,
					'123456789012345678901234567890',
					'123456789012345678901234567890'
				);
				await formPage.input.fillAndExpectInputValue(
					questionLabel,
					'abcdefghijklmnopqrstñňáãûüêè`(&%$#&%$##"#明日でも',
					'abcdefghijklmnopqrstñňáãûüêè`(&%$#&%$##"#明日でも'
				);
			});
		});

		test.describe('String type with "numbers" appearance', () => {
			const questionLabel = 'String number';

			test('disallows invalid characters', async () => {
				await formPage.input.fillAndExpectInputValue(questionLabel, 'abce', '');
				await formPage.input.fillAndExpectInputValue(questionLabel, '$#!Sds)=;+(', '');
				await formPage.input.fillAndExpectInputValue(questionLabel, '233-abc-456-tgh', '233--456-');
				await formPage.input.fillAndExpectInputValue(questionLabel, '765.abc', '765.');
			});

			test('allows digits, comma, dot, minus sign and long values', async () => {
				await formPage.input.fillAndExpectInputValue(questionLabel, '-123.098,56', '-123.098,56');
				await formPage.input.fillAndExpectInputValue(
					questionLabel,
					'123456789012345678901234567890',
					'123456789012345678901234567890'
				);
				await formPage.input.fillAndExpectInputValue(
					questionLabel,
					'233-999-456-432',
					'233-999-456-432'
				);
				await formPage.input.fillAndExpectInputValue(
					questionLabel,
					'765.235,32.742,22',
					'765.235,32.742,22'
				);
			});
		});

		test.describe('String type with "numbers" and "thousands-sep" appearances', () => {
			const questionLabel = 'String number with thousands separator';

			test('disallows invalid characters', async () => {
				await formPage.input.fillAndExpectInputValue(questionLabel, 'abce', '');
				await formPage.input.fillAndExpectInputValue(questionLabel, '$#!Sds)=;+(', '');
				await formPage.input.fillAndExpectInputValue(questionLabel, '233-abc-456-tgh', '233,456');
				// Last digit dot to allow user type decimals
				await formPage.input.fillAndExpectInputValue(questionLabel, '765.', '765.');
				await formPage.input.fillAndExpectInputValue(
					questionLabel,
					'765.235,32.742,22',
					'765.2353274222'
				);
			});

			test('allows digits, comma, dot, minus sign and long values', async () => {
				await formPage.input.fillAndExpectInputValue(questionLabel, '-123098.56', '-123,098.56');
				await formPage.input.fillAndExpectInputValue(
					questionLabel,
					'5123456789012345678901234567.890',
					'5,123,456,789,012,345,678,901,234,567.890'
				);
			});
		});
	});

	test.describe('Numerical question types', () => {
		test.describe('Integer type', () => {
			const questionLabel = 'Integer';

			test('allows up to 9 characters', async () => {
				await formPage.input.typeAndExpectInputValue(questionLabel, '1234567891234', '123456789');
				await formPage.input.typeAndExpectInputValue(questionLabel, '-12312312345', '-12312312');
				await formPage.input.typeAndExpectInputValue(questionLabel, '678', '678');
			});

			test('disallows decimals and other characters that are not minus sign and digits', async () => {
				await formPage.input.typeAndExpectInputValue(questionLabel, '-123.098,56', '-12309856');
				await formPage.input.typeAndExpectInputValue(questionLabel, 'avbt234%$"3.,8', '23438');
			});

			test('Rounds up using the "round half up" rule when a decimal value is pasted into the input', async () => {
				await formPage.copyToClipboard('146.89');
				await formPage.input.pasteAndExpectInputValue(questionLabel, '147');

				await formPage.copyToClipboard('146.45');
				await formPage.input.pasteAndExpectInputValue(questionLabel, '146');
			});
		});

		test.describe('Decimal type', () => {
			const questionLabel = 'Decimal';

			test('allows up to 15 characters and decimals', async () => {
				await formPage.input.typeAndExpectInputValue(
					questionLabel,
					'1234567891234567890',
					'123456789123456'
				);
				await formPage.input.typeAndExpectInputValue(
					questionLabel,
					'-1231231234567890',
					'-12312312345678'
				);
				await formPage.input.typeAndExpectInputValue(
					questionLabel,
					'-12312.31234567890',
					'-12312.31234567'
				);
				await formPage.input.typeAndExpectInputValue(questionLabel, '678.765', '678.765');
			});

			test('disallows other characters that are not minus sign and digits', async () => {
				await formPage.input.typeAndExpectInputValue(questionLabel, '-123.098,56', '-123.09856');
				await formPage.input.typeAndExpectInputValue(questionLabel, 'avbt234%$"3.,8', '2343.8');
			});
		});
	});

	/**
	 * This is a slow suite; it waits for map animations and rendering to finish.
	 * If additional tests are included, we might run them only on one browser, on merge, or on request.
	 */
	test.describe('Select one from map', () => {
		let mapComponent: Locator;

		test.beforeAll(async () => {
			await formPage.waitForNetworkIdle();
			await formPage.text.expectHint(
				'select_one type with map appearance. Choices are loaded from a GeoJSON attachment'
			);
			mapComponent = formPage.map.getMapComponentLocator('Map');
		});

		test.beforeEach(async () => {
			await formPage.waitForNetworkIdle();
			await formPage.map.expectMapVisible(mapComponent);
			await formPage.map.scrollMapIntoView(mapComponent);
		});

		test('renders map, selects feature, and saves selection', async () => {
			await formPage.map.expectMapScreenshot(mapComponent, 'select-map-initial-state.png');

			await formPage.map.selectFeature(700, 222);
			await formPage.map.expectMapScreenshot(mapComponent, 'select-map-point-selected.png');

			await formPage.map.saveSelection(mapComponent);
			await formPage.map.expectMapScreenshot(mapComponent, 'select-map-point-saved.png');
			await formPage.map.closeProperties(mapComponent);
		});

		test('toggles full screen and verifies more surface map is visible', async () => {
			await formPage.map.toggleFullScreen(mapComponent);
			await formPage.map.expectFullScreenActive(mapComponent);
			await formPage.map.expectMapScreenshot(mapComponent, 'select-map-full-screen.png', true);
			await formPage.map.exitFullScreen(mapComponent);
		});

		test('zooms in and out, pans the map and zooms to fit all features', async () => {
			await formPage.map.zoomOut(mapComponent, 2);
			await formPage.map.expectMapScreenshot(mapComponent, 'select-map-zoom-out.png');
			await formPage.map.zoomIn(mapComponent, 3);
			await formPage.map.expectMapScreenshot(mapComponent, 'select-map-zoom-in.png');
			await formPage.map.panMap(mapComponent, 300, -200);
			await formPage.map.expectMapScreenshot(mapComponent, 'select-map-panning.png');
			await formPage.map.zoomToFitAll(mapComponent);
			await formPage.map.expectMapScreenshot(
				mapComponent,
				'select-map-zoom-to-fit-all-features.png'
			);
		});

		test('opens details of saved feature and remove saved feature', async () => {
			await formPage.map.viewDetailsOfSavedFeature(mapComponent);
			await formPage.map.expectMapScreenshot(mapComponent, 'select-map-view-details.png');
			await formPage.map.removeSavedFeature(mapComponent);
			await formPage.map.expectMapScreenshot(mapComponent, 'select-map-removed-saved-feature.png');
			await formPage.map.closeProperties(mapComponent);
		});

		test('zooms to current location', async () => {
			await formPage.waitForNetworkIdle();
			await formPage.map.scrollMapIntoView(mapComponent);
			await formPage.map.centerCurrentLocation(mapComponent);
			await formPage.map.expectMapScreenshot(mapComponent, 'select-map-zoom-current-location.png');
		});
	});
});

test.describe('All Question Types - Geolocation permission denied', () => {
	let formPage: FillFormPage;
	let context: BrowserContext;

	test.beforeAll(async ({ browser }) => {
		context = await browser.newContext({
			permissions: [],
		});

		const page = await context.newPage();
		const previewPage = new PreviewPage(page);
		await previewPage.goToDevPage();

		const newPage = await previewPage.openPublicDemoForm(
			'All question types',
			'All question types'
		);
		formPage = new FillFormPage(newPage);
		await formPage.waitForNetworkIdle();
	});

	test.afterAll(async () => {
		await context?.close();
	});

	test('select from map displays error when zooming to current location', async () => {
		const mapComponent = formPage.map.getMapComponentLocator('Map');
		await formPage.map.scrollMapIntoView(mapComponent);
		await formPage.map.centerCurrentLocation(mapComponent);
		await formPage.map.expectErrorMessage(
			mapComponent,
			'Cannot access location',
			'Grant location permission in the browser settings and make sure location is turned on.'
		);
	});
});
