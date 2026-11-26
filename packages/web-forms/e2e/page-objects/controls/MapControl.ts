import { expect, Locator, Page } from '@playwright/test';
import { expectFullScreenScreenshot, expectScreenshot } from '../../screenshot.ts';

const matchSettledCountOtherThan = (settledCount: string | null) => {
  return new RegExp(`^(?!${settledCount}$)\\d+$`);
};

export class MapControl {
  private readonly MAP_COMPONENT_SELECTOR = '.map-block-component';
  private readonly MAP_CONTAINER_SELECTOR = '.map-container';
  private readonly MAP_SELECTOR = '.map-block';
  private readonly SETTLED_ATTRIBUTE = 'data-render-settled';

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
      // Allows reaching the expected zoom level before zooming again for consistent results.
      await this.moveMapAndWaitToSettle(mapComponent, () => button.click());
    }
  }

  async zoomOut(mapComponent: Locator, times = 1) {
    const button = mapComponent.locator('.ol-zoom').getByText('–', { exact: true });
    await expect(button).toBeVisible();
    for (let i = 0; i < times; i++) {
      // Allows reaching the expected zoom level before zooming again for consistent results.
      await this.moveMapAndWaitToSettle(mapComponent, () => button.click());
    }
  }

  async zoomToFitAll(mapComponent: Locator) {
    const button = mapComponent.locator('button.zoom-fit-all');
    await expect(button).toBeVisible();
    await button.click();
  }

  async requestCurrentLocation(mapComponent: Locator) {
    const button = mapComponent.locator('button.zoom-current-location');
    await expect(button).toBeVisible();
    await button.click();
  }

  async centerCurrentLocation(mapComponent: Locator) {
    await this.moveMapAndWaitToSettle(mapComponent, () =>
      this.requestCurrentLocation(mapComponent)
    );
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
    // Leaving full screen refits the map to its features with an animation.
    await this.moveMapAndWaitToSettle(mapComponent, () => this.page.keyboard.press('Escape'));
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
    await this.moveMapAndWaitToSettle(mapComponent, () => button.click());
  }

  async openBaseLayerPicker(mapComponent: Locator) {
    const button = mapComponent.getByRole('button', { name: 'Change map layer' });
    await expect(button).toBeVisible();
    await button.click();
    await expect(mapComponent.locator('.base-layer-options')).toBeVisible();
  }

  async selectBaseLayer(mapComponent: Locator, layerName: string) {
    const option = mapComponent.locator('.base-layer-options').getByRole('option', {
      name: layerName,
      exact: true,
    });
    await expect(option).toBeVisible();
    await option.click();
  }

  async closeBaseLayerPicker(mapComponent: Locator) {
    await this.page.keyboard.press('Escape');
    await expect(mapComponent.locator('.base-layer-options')).not.toBeVisible();
  }

  async searchPlace(mapComponent: Locator, query: string) {
    const input = mapComponent.locator('.map-place-search input');
    await expect(input).toBeVisible();
    await input.fill(query);
    await input.press('Enter');
    await expect(mapComponent.locator('.search-results')).toBeVisible();
  }

  async selectPlace(mapComponent: Locator, placeName: string) {
    const option = mapComponent.locator('.search-results').getByRole('option', {
      name: placeName,
      exact: true,
    });
    await expect(option).toBeVisible();
    await option.click();
    await expect(mapComponent.locator('.search-results')).not.toBeVisible();
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

  private async waitForNextPaint(map: Locator) {
    await map.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    );
  }

  private async waitForMapToSettle(mapComponent: Locator) {
    const map = mapComponent.locator(this.MAP_SELECTOR);
    await this.waitForNextPaint(map);
    await expect(map).toHaveAttribute(this.SETTLED_ATTRIBUTE);
    await this.page.waitForLoadState('networkidle');
  }

  private async moveMapAndWaitToSettle(mapComponent: Locator, moveMap: () => Promise<void>) {
    const map = mapComponent.locator(this.MAP_SELECTOR);
    const settledCount = await map.getAttribute(this.SETTLED_ATTRIBUTE);
    await moveMap();
    await expect(map).toHaveAttribute(
      this.SETTLED_ATTRIBUTE,
      matchSettledCountOtherThan(settledCount)
    );
  }

  async expectMapScreenshot(mapComponent: Locator, screenshotName: string, isFullScreen = false) {
    const map = mapComponent.locator(this.MAP_CONTAINER_SELECTOR);
    await this.waitForMapToSettle(mapComponent);
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
