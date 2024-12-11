import OdkWebForm from '@/components/OdkWebForm.vue';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	getFormXml,
	getWebFormsTestFixture,
	globalMountOptions,
	mockElementPrototypeMethod,
	type ElementMethodName,
} from '../helpers';

const mountComponent = (formXML: string) => {
	const component = mount(OdkWebForm, {
		props: {
			formXml: formXML,
			fetchFormAttachment: () => {
				throw new Error('Not exercised here');
			},
		},
		global: globalMountOptions,
		attachTo: document.body,
	});

	return component;
};

describe('OdkWebForm', () => {
	let formXML: string;
	let elementKeysAdded: ElementMethodName[];

	beforeEach(async () => {
		formXML = await getFormXml('2-simple-required.xml');

		elementKeysAdded = [];
		mockElementPrototypeMethod('scrollTo', () => {
			/* Do nothing */
		});
		mockElementPrototypeMethod('showPopover', function () {
			this.style.display = 'block';
		});
		mockElementPrototypeMethod('hidePopover', function () {
			this.style.display = 'none';
		});
	});

	afterEach(() => {
		elementKeysAdded.forEach((methodName) => {
			delete HTMLElement.prototype[methodName];
		});
		vi.restoreAllMocks();
	});

	it('shows validation banner and highlights on submit and hide once valid value(s) are set', async () => {
		const component = mountComponent(formXML);
		await flushPromises();

		// Assert no validation banner and no highlighted question
		expect(component.get('.form-error-message').isVisible()).toBe(false);
		expect(component.get('.question-container').classes().includes('highlight')).toBe(false);

		// Click submit
		await component.get('button[aria-label="Send"]').trigger('click');

		// Assert validation banner is visible and question container is highlighted
		expect(component.get('.form-error-message').isVisible()).toBe(true);
		expect(component.get('.question-container').classes().includes('highlight')).toBe(true);

		// Enter text to make question valid
		await component.get('input.p-inputtext').setValue('ok');

		// Assert no validation banner and no highlighted question
		expect(component.find('.form-error-message').isVisible()).toBe(false);
		expect(component.get('.question-container').classes().includes('highlight')).toBe(false);
	});

	it('shows validation banner and highlights again if any question becomes invalid again', async () => {
		const component = mountComponent(formXML);
		await flushPromises();

		// Assert no validation banner and no highlighted question
		expect(component.get('.form-error-message').isVisible()).toBe(false);
		expect(component.get('.question-container').classes().includes('highlight')).toBe(false);

		// Click submit
		await component.get('button[aria-label="Send"]').trigger('click');

		// Assert validation banner is visible and question container is highlighted
		expect(component.get('.form-error-message').isVisible()).toBe(true);
		expect(component.get('.question-container').classes().includes('highlight')).toBe(true);

		// Enter text to make question valid
		await component.get('input.p-inputtext').setValue('ok');

		// Assert no validation banner and no highlighted question
		expect(component.find('.form-error-message').isVisible()).toBe(false);
		expect(component.get('.question-container').classes().includes('highlight')).toBe(false);

		// Empty the textbox to make it invalid again
		await component.get('input.p-inputtext').setValue('');

		// Assert validation banner is visible and question container is highlighted again
		expect(component.get('.form-error-message').isVisible()).toBe(true);
		expect(component.get('.question-container').classes().includes('highlight')).toBe(true);
	});

	describe('form load failure', () => {
		// TODO: this test uses a fixture which currently causes engine-internal
		// reactivity (Solid) to produce a "potential infinite loop" error.
		// Triggering this error is slow: detection uses a heuristic of a hard limit
		// on the reactive call stack depth. When we reintroduce cycle detection in
		// the future, we will probably want to remove this timeout option!
		it(
			'presents an error message when failing to load a form with a cyclic computation',
			{ timeout: 5000 },
			async () => {
				const dagCycleFormXML = await getWebFormsTestFixture('simple-dag-cycle.xml');
				const component = mountComponent(dagCycleFormXML);

				await flushPromises();

				expect(component.get('.form-load-failure-dialog').isVisible()).toBe(true);
			}
		);

		it('presents an error message when failing to load a form with a computation containing an XPath syntax error', async () => {
			const xpathSyntaxErrorFormXML = await getWebFormsTestFixture('xpath-syntax-error.xml');
			const component = mountComponent(xpathSyntaxErrorFormXML);

			await flushPromises();

			expect(component.get('.form-load-failure-dialog').isVisible()).toBe(true);
		});

		// TODO: tests failure which is currently produced by throwing a string.
		// Checking the text content here is intended to ensure we are actually
		// presenting the message to a user.
		it('presents an error message when failing to load a form with a computation referencing an unknown XPath function', async () => {
			const xpathUnknownFunctionFormXML = await getWebFormsTestFixture(
				'xpath-unknown-function.xml'
			);
			const component = mountComponent(xpathUnknownFunctionFormXML);

			await flushPromises();

			const formLoadFailureDialog = component.get('.form-load-failure-dialog');

			expect(formLoadFailureDialog.isVisible()).toBe(true);

			const message = formLoadFailureDialog.get('.message');

			expect(message.text()).toMatch(/\bnope\b/);
		});
	});
});
