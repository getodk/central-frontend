import { expect, test } from '@playwright/test';
import { PreviewPage } from '../../page-objects/pages/PreviewPage.js';

test('Build includes component-defined styles', async ({ page }) => {
	const previewPage = new PreviewPage(page);
	await previewPage.goToBuildPage();

	// This ensures that the application is loaded before proceeding forward.
	await expect(page.getByText('ODK Web Forms Preview').first()).toBeVisible();

	// Get the (Sass-defined) large breakpoint size
	// [In theory, if we can get this and it's not a number, we've already validated styles. Below expands on that to leave some breadcrumbs]
	const breakpointLg = await page.locator('html').evaluate((pageRoot) => {
		// This CSS variable is defined in {@link https://github.com/getodk/web-forms/blob/main/packages/web-forms/src/components/OdkWebForm.vue}
		return getComputedStyle(pageRoot).getPropertyValue('--odk-test-breakpoint-lg');
	});
	const largeViewportSize = parseInt(breakpointLg, 10);

	// Technically, this assertion passing is already assurance that styles are
	// effective in the build.
	//
	// The remainder of the test action/assertions leave some additional
	// breadcrumbs in case we want to expand on style testing, e.g. to guard
	// against regressions in specific presentation aspects.
	expect(Number.isNaN(largeViewportSize)).toBe(false);

	// Setting viewport to `$lg` breakpoint ensures the `--odk-muted-background-color` background
	// color is effective for `body`.
	await page.setViewportSize({
		width: largeViewportSize,
		height: largeViewportSize,
	});

	// Assign several colors to `--odk-muted-background-color`, checking that the color is
	// (initially) **not** the body's effective background color, and then that it
	// is once assigned to that custom property.
	//
	// This is effectively testing the application of that style, using that
	// variable, in OdkWebForm.vue.
	const colors = ['rgb(255, 0, 0)', 'rgb(0, 255, 0)', 'rgb(0, 0, 255)'];

	for (const color of colors) {
		await expect(page.locator('body')).not.toHaveCSS('background-color', color);

		await page.locator('html').evaluate((pageRoot, backgroundColor) => {
			pageRoot.style.setProperty('--odk-muted-background-color', backgroundColor);
		}, color);

		await expect(page.locator('body')).toHaveCSS('background-color', color);
	}
});
