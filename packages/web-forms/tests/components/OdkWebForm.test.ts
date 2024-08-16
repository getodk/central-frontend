import OdkWebForm from '@/components/OdkWebForm.vue';
import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { getFormXml, globalMountOptions } from '../helpers';
const mountComponent = () => {
	const xform = getFormXml('validation/2-simple-required.xml');

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
	if (!Element.prototype.scrollIntoView) {
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		Element.prototype.scrollIntoView = () => {};
	}
	if (!HTMLElement.prototype.showPopover) {
		HTMLElement.prototype.showPopover = function () {
			this.style.display = 'block';
		};
	}
	if (!HTMLElement.prototype.hidePopover) {
		HTMLElement.prototype.hidePopover = function () {
			this.style.display = 'none';
		};
	}

	it('shows validation banner on submit and responds appropriately to the change of validation state of the question', async () => {
		const component = mountComponent();
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
