import { expect, Locator, Page } from '@playwright/test';
import { expectFullScreenScreenshot, expectScreenshot } from '../../screenshot.ts';

const ANIMATION_TIME = 1000; // Map has a default of 1s rendering and animation time
const GEOLOCATION_DEBOUNCE_TIME = 500;
const FLY_TO_CURRENT_LOCATION_TIME = GEOLOCATION_DEBOUNCE_TIME + ANIMATION_TIME * 2;

export class MapControl {
  private readonly MAP_COMPONENT_SELECTOR = '.map-block-component';
  private readonly MAP_CONTAINER_SELECTOR = '.map-container';
  private readonly MAP_SELECTOR = '.map-block';

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
    const PAN_RELEASE_DELAY = 150;
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
    await this.page.waitForTimeout(PAN_RELEASE_DELAY);
    await this.page.mouse.up();
  }

  async tapToAddPoint(mapComponent: Locator, moveX: number, moveY: number) {
    const box = await mapComponent.locator(this.MAP_CONTAINER_SELECTOR).boundingBox();
    if (!box) {
      return;
    }

    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    await this.page.mouse.move(centerX + moveX, centerY + moveY);
    await this.page.mouse.down();
    await this.page.waitForTimeout(200); // Press
    await this.page.mouse.up();
    await this.page.waitForTimeout(300); // Process point
  }

  async zoomIn(mapComponent: Locator, times = 1) {
    const button = mapComponent.locator('.ol-zoom').getByText('+', { exact: true });
    await expect(button).toBeVisible();
    for (let i = 0; i < times; i++) {
      await button.click();
      // Allows reaching the expected zoom level before zooming again for consistent results.
      await this.page.waitForTimeout(ANIMATION_TIME);
    }
  }

  async zoomOut(mapComponent: Locator, times = 1) {
    const button = mapComponent.locator('.ol-zoom').getByText('–', { exact: true });
    await expect(button).toBeVisible();
    for (let i = 0; i < times; i++) {
      await button.click();
      // Allows reaching the expected zoom level before zooming again for consistent results.
      await this.page.waitForTimeout(ANIMATION_TIME);
    }
  }

  async zoomToFitAll(mapComponent: Locator) {
    const button = mapComponent.locator('button.zoom-fit-all');
    await expect(button).toBeVisible();
    await button.click();
  }

  async centerCurrentLocation(mapComponent: Locator) {
    const button = mapComponent.locator('button.zoom-current-location');
    await expect(button).toBeVisible();
    await button.click();
    await this.page.waitForTimeout(FLY_TO_CURRENT_LOCATION_TIME);
  }

  async toggleFullScreen(mapComponent: Locator) {
    const button = mapComponent.locator('button.fullscreen');
    await expect(button).toBeVisible();
    await button.click();
  }

  async expectFullScreenActive(mapComponent: Locator) {
    await expect(mapComponent).toHaveAttribute('class', expect.stringContaining('map-full-screen'));
  }

  async exitFullScreen(mapComponent: Locator) {
    await this.page.keyboard.press('Escape');
    await expect(mapComponent.locator('.map-full-screen')).not.toBeVisible();
    // Leaving full screen refits the map to its features with an animation.
    await this.page.waitForTimeout(ANIMATION_TIME);
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
    await this.page.waitForTimeout(FLY_TO_CURRENT_LOCATION_TIME);
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

  // The map can stop redrawing on the frame where its last tile arrived, still showing tiles from other zoom
  // levels. Resizing it by a pixel and back makes it draw a final frame with the tiles it has.
  private async redrawMap(map: Locator) {
    await map.evaluate(async (element) => {
      const waitForNextPaint = () =>
        new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      element.style.width = 'calc(100% - 1px)';
      await waitForNextPaint();
      element.style.width = '';
      await waitForNextPaint();
    });
  }

  private async waitForMapToSettle() {
    // It cannot disable map's JS animations. So setting timeout.
    await this.page.waitForTimeout(ANIMATION_TIME);
    await this.page.waitForLoadState('networkidle');
  }

  async expectMapScreenshot(mapComponent: Locator, screenshotName: string, isFullScreen = false) {
    const map = mapComponent.locator(this.MAP_CONTAINER_SELECTOR);
    await this.waitForMapToSettle();
    await this.redrawMap(map);

    if (isFullScreen) {
      await expectFullScreenScreenshot(this.page, map, screenshotName);
      return;
    }

    await expectScreenshot({
      page: this.page,
      locator: map,
      screenshotName,
      width: 802,
      height: 507,
    });
  }
}
