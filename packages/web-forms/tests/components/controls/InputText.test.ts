import InputText from '@/components/controls/InputText.vue';
import type { StringNode } from '@getodk/xforms-engine';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { getReactiveForm, globalMountOptions } from '../../helpers';

const mountComponent = async (questionNumber: number, submitPressed = false) => {
	const xform = await getReactiveForm('validation/1-validation.xml');

	return mount(InputText, {
		props: {
			question: xform.currentState.children[questionNumber] as StringNode,
		},
		global: { ...globalMountOptions, provide: { submitPressed } },
		attachTo: document.body,
	});
};

describe('InputText', () => {
	describe('validation', () => {
		it('does not show validation message on init', async () => {
			const component = await mountComponent(0);
			expect(component.get('.validation-message').isVisible()).toBe(false);
		});

		it('shows validation message for invalid state and user has done editing', async () => {
			const component = await mountComponent(0);
			const input = component.find('input');
			await input.trigger('blur');
			expect(component.get('.validation-message').isVisible()).toBe(true);
			expect(component.get('.validation-message').text()).toBe('Condition not satisfied: required');
		});

		it('hides validation message when user enters a valid value', async () => {
			const component = await mountComponent(0);
			const input = component.find('input');
			await input.setValue('lorem ipsum');
			expect(component.get('.validation-message').text()).toBe('');
		});

		it('shows validation message on submit pressed even when no interaction is made with the component', async () => {
			const component = await mountComponent(0, true);
			expect(component.get('.validation-message').isVisible()).toBe(true);
			expect(component.get('.validation-message').text()).toBe('Condition not satisfied: required');
		});
	});
});
