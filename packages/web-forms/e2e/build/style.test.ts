import { expect, test } from '@playwright/test';

test('Build includes component-defined styles', async ({ page }) => {
	await page.goto('http://localhost:5174/');

	// This ensures that the application is loaded before proceeding forward.
	await expect(page.getByText('Calculate (simple)').first()).toBeVisible();

	// Get the (Sass-defined) large breakpoint size
	// [In theory, if we can get this and it's not a number, we've already validated styles. Below expands on that to leave some breadcrumbs]
	const breakpointLg = await page.locator('html').evaluate((pageRoot) => {
		return getComputedStyle(pageRoot).getPropertyValue('--breakpoint-lg');
	});
	const largeViewportSize = parseInt(breakpointLg, 10);

	// Technically, this assertion passing is already assurance that styles are
	// effective in the build.
	//
	// The remainder of the test action/assertions leave some additional
	// breadcrumbs in case we want to expand on style testing, e.g. to guard
	// against regressions in specific presentation aspects.
	expect(Number.isNaN(largeViewportSize)).toBe(false);

	// Setting viewport to `$lg` breakpoint ensures the `--gray-200` background
	// color is effective for `body`.
	await page.setViewportSize({
		width: largeViewportSize,
		height: largeViewportSize,
	});

	// Assign several colors to `--gray-200`, checking that the color is
	// (initially) **not** the body's effective background color, and then that it
	// is once assigned to that custom property.
	//
	// This is effectively testing the application of that style, using that
	// variable, in OdkWebForm.vue.
	const colors = ['rgb(255, 0, 0)', 'rgb(0, 255, 0)', 'rgb(0, 0, 255)'];

	for await (const color of colors) {
		await expect(page.locator('body')).not.toHaveCSS('background-color', color);

		await page.locator('html').evaluate((pageRoot, gray200) => {
			pageRoot.style.setProperty('--gray-200', gray200);
		}, color);

		await expect(page.locator('body')).toHaveCSS('background-color', color);
	}
});
