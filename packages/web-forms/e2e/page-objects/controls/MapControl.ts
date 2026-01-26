import { expect, Locator, Page } from '@playwright/test';

export class MapControl {
	private readonly MAP_COMPONENT_SELECTOR = '.map-block-component';
	private readonly MAP_CONTAINER_SELECTOR = '.map-container';
	private readonly MAP_SELECTOR = '.map-block';
	private readonly ANIMATION_TIME = 1000; // Map has a default of 1s rendering and animation time

	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	getMapComponentLocator(label: string) {
		const question = this.page
			.locator('.question-container')
			.filter({ has: this.page.locator(`.control-text label:text-is("${label}")`) });
		return question.locator(this.MAP_COMPONENT_SELECTOR);
	}

	async expectMapVisible(mapComponent: Locator) {
		const map = mapComponent.locator(this.MAP_SELECTOR);
		await expect(map, `Map not found`).toBeVisible();
	}

	/**
	 * Playwright's scrollIntoViewIfNeeded() scrolls minimally and doesn't guarantee to center
	 * the element, so JavaScript scroll is used to ensure the map is centered and fully visible.
	 */
	async scrollMapIntoView(mapComponent: Locator) {
		const handle = await mapComponent.elementHandle();
		if (handle) {
			await handle.evaluate((el) => el.scrollIntoView({ block: 'center' }));
		}
	}

	/**
	 * Pans the map starting from the center of the component.
	 * @param moveX Pixels. Relative to the map component center.
	 * @param moveY Pixels. Relative to the map component center.
	 */
	async panMap(mapComponent: Locator, moveX: number, moveY: number) {
		await mapComponent.scrollIntoViewIfNeeded();
		const mapContainer = mapComponent.locator(this.MAP_CONTAINER_SELECTOR);
		const box = await mapContainer.boundingBox();
		if (!box) {
			return;
		}

		const centerX = box.x + box.width / 2;
		const centerY = box.y + box.height / 2;

		await this.page.mouse.move(centerX, centerY);
		await this.page.mouse.down();
		await this.page.mouse.move(centerX + moveX, centerY + moveY, { steps: 40 });

		await this.page.mouse.up();
	}

	async longPressMap(mapComponent: Locator, moveX: number, moveY: number) {
		const box = await mapComponent.locator(this.MAP_CONTAINER_SELECTOR).boundingBox();
		if (!box) {
			return;
		}

		const centerX = box.x + box.width / 2;
		const centerY = box.y + box.height / 2;

		await this.page.mouse.move(centerX + moveX, centerY + moveY);
		await this.page.mouse.down();
		await this.page.waitForTimeout(1400); // Press and hold
		await this.page.mouse.up();
		await this.page.waitForTimeout(300); // Process point
	}

	async zoomIn(mapComponent: Locator, times = 1) {
		const button = mapComponent.locator('.ol-zoom').getByText('+', { exact: true });
		await expect(button).toBeVisible();
		for (let i = 0; i < times; i++) {
			await button.click();
			// Allows reaching the expected zoom level before zooming again for consistent results.
			await this.page.waitForTimeout(this.ANIMATION_TIME);
		}
	}

	async zoomOut(mapComponent: Locator, times = 1) {
		const button = mapComponent.locator('.ol-zoom').getByText('–', { exact: true });
		await expect(button).toBeVisible();
		for (let i = 0; i < times; i++) {
			await button.click();
			// Allows reaching the expected zoom level before zooming again for consistent results.
			await this.page.waitForTimeout(this.ANIMATION_TIME);
		}
	}

	async zoomToFitAll(mapComponent: Locator) {
		const button = mapComponent.locator('button[title="Zoom to fit all options"]');
		await expect(button).toBeVisible();
		await button.click();
	}

	async centerCurrentLocation(mapComponent: Locator) {
		const button = mapComponent.locator('button[title="Zoom to current location"]');
		await expect(button).toBeVisible();
		await button.click();
		// Wait for the current location icon to appear on the map.
		await this.page.waitForTimeout(this.ANIMATION_TIME);
	}

	async toggleFullScreen(mapComponent: Locator) {
		const button = mapComponent.locator('button[title="Full Screen"]');
		await expect(button).toBeVisible();
		await button.click();
	}

	async expectFullScreenActive(mapComponent: Locator) {
		await expect(mapComponent).toHaveAttribute('class', expect.stringContaining('map-full-screen'));
	}

	async exitFullScreen(mapComponent: Locator) {
		await this.page.keyboard.press('Escape');
		await expect(mapComponent.locator('.map-full-screen')).not.toBeVisible();
	}

	/**
	 * Selects feature on map
	 * @param positionX Pixels. Relative to the left of the browser's viewport.
	 * @param positionY Pixels. Relative to the top of the browser's viewport.
	 */
	async selectFeature(positionX: number, positionY: number) {
		await this.page.mouse.move(positionX, positionY);
		await this.page.mouse.down();
		await this.page.mouse.up();
	}

	async saveSelection(mapComponent: Locator) {
		const button = mapComponent.locator('.map-properties').getByText('Save selected');
		await expect(button).toBeVisible();
		await button.click();
	}

	async removeSavedFeature(mapComponent: Locator) {
		const button = mapComponent.locator('.map-properties').getByText('Remove selection');
		await expect(button).toBeVisible();
		await button.click();
	}

	async removeSavedPoint(mapComponent: Locator) {
		const button = mapComponent.locator('.map-status-container').getByText('Remove point');
		await expect(button).toBeVisible();
		await button.click();
	}

	async viewDetailsOfSavedFeature(mapComponent: Locator) {
		const button = mapComponent.locator('.map-status-container').getByText('View details');
		await expect(button).toBeVisible();
		await button.click();
	}

	async getLocationFromOverlay(mapComponent: Locator) {
		const button = mapComponent.locator('.map-overlay').getByText('Get location');
		await expect(button).toBeVisible();
		await button.click();
		// Wait for the current location icon to appear on the map.
		await this.page.waitForTimeout(this.ANIMATION_TIME);
	}

	async closeProperties(mapComponent: Locator) {
		const button = mapComponent.locator('.map-properties .close-icon');
		await expect(button).toBeVisible();
		await button.click();
		await expect(mapComponent.locator('.map-properties')).not.toBeVisible();
	}

	async expectErrorMessage(mapComponent: Locator, expectedTitle: string, expectedMessage: string) {
		const error = mapComponent.locator('.map-block-error');
		await expect(error.locator('strong')).toHaveText(expectedTitle);
		await expect(error.locator('span')).toHaveText(expectedMessage);
	}

	async expectMapScreenshot(mapComponent: Locator, snapshotName: string, isFullScreen = false) {
		// It cannot disable map's JS animations. So setting timeout.
		await this.page.waitForTimeout(this.ANIMATION_TIME);

		const map = mapComponent.locator(this.MAP_CONTAINER_SELECTOR);
		const browserName = this.page.context().browser()?.browserType().name();
		const isChromiumLinux = process.platform === 'linux' && browserName === 'chromium';

		if (isChromiumLinux) {
			// Chrome for Linux has an issue when taking the snapshot (ref. https://github.com/microsoft/playwright/issues/18827)
			const width = isFullScreen ? 1280 : 802;
			const heigth = isFullScreen ? 720 : 507;
			await this.page.addStyleTag({
				content: `
        .map-container {
          width: ${width}px !important;
          height: ${heigth}px !important;
          max-width: ${width}px !important;
          max-height: ${heigth + 1}px !important;
        }
        body, html {
          overflow: hidden !important;
        }
      `,
			});

			await this.page.waitForTimeout(this.ANIMATION_TIME);
		}

		await expect(map).toHaveScreenshot(snapshotName, {
			maxDiffPixelRatio: 0.02,
		});
	}
}
