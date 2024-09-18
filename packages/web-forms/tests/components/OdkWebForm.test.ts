import OdkWebForm from '@/components/OdkWebForm.vue';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	getFormXml,
	globalMountOptions,
	mockElementPrototypeMethod,
	type ElementMethodName,
} from '../helpers';

const mountComponent = async () => {
	const xform = await getFormXml('2-simple-required.xml');

	const component = mount(OdkWebForm, {
		props: {
			formXml: xform,
		},
		global: globalMountOptions,
		attachTo: document.body,
	});

	return component;
};

describe('OdkWebForm', () => {
	let elementKeysAdded: ElementMethodName[];

	beforeEach(() => {
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
		const component = await mountComponent();
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
		const component = await mountComponent();
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
});
