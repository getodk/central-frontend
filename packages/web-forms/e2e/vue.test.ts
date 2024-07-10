import { faker } from '@faker-js/faker';
import { expect, test } from '@playwright/test';

test('All forms are rendered and there is no console error', async ({ page, browserName }) => {
	let consoleErrors = 0;

	page.on('console', (msg) => {
		if (msg.type() === 'error' || msg.type() === 'warning') {
			consoleErrors++;
		}
	});

	await page.goto('http://localhost:5173');

	// this ensures that Vue application is loaded before proceeding forward.
	await expect(page.getByText('Demo Forms')).toBeVisible();

	const forms = await page.locator('ul.form-list li').all();

	expect(forms.length).toBeGreaterThan(0);

	for (const form of forms) {
		await form.click();

		// Traverse the form element by element
		// if focused element is an editable textbox then fill it
		// Exit the loop when focus is on the Send button
		while (true) {
			const onSendButton = await page.evaluate(() => {
				const activeElement = document.activeElement;
				return activeElement?.tagName === 'BUTTON' && activeElement.textContent === 'Send';
			});

			if (onSendButton) {
				break;
			}

			await page.keyboard.press(browserName == 'webkit' ? 'Alt+Tab' : 'Tab');

			const inputType = await page.evaluate(() => {
				const isInputElement = (
					activeElement: Element | null
				): activeElement is HTMLInputElement => {
					return activeElement?.tagName === 'INPUT';
				};

				const activeElement = document.activeElement;

				if (
					!isInputElement(activeElement) ||
					activeElement.hasAttribute('readonly') ||
					activeElement.hasAttribute('disabled')
				) {
					return null;
				}

				return activeElement.type;
			});

			if (inputType === 'text') {
				await page.keyboard.type(faker.internet.displayName());
			}
			// Select the next option, if the last option is selected by default
			// then browser selects the first one.
			else if (inputType === 'radio') {
				await page.keyboard.press('ArrowDown');
			}
			// Tab behaviour for checkboxes is different, each Tab press moves the focus
			// to the next option. Here we are toggling every checkbox option.
			else if (inputType === 'checkbox') {
				// Toggle the option
				await page.keyboard.press('Space');
			}
		}

		const langChanger = page.locator('.larger-screens .language-changer');

		if ((await langChanger.count()) > 0) {
			await langChanger.click();
			await page.locator('.language-dd-label').last().click();
		}

		await page.goBack();
	}

	expect(consoleErrors).toBe(0);
});
