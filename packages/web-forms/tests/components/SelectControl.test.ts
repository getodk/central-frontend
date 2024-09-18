import SelectControl from '@/components/controls/SelectControl.vue';
import type { SelectNode } from '@getodk/xforms-engine';
import { DOMWrapper, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { getReactiveForm, globalMountOptions } from '../helpers';

const mountComponent = async (
	questionNumber: number,
	formPath = '1-static-selects.xml',
	submitPressed = false
) => {
	const xform = await getReactiveForm(formPath);

	const component = mount(SelectControl, {
		props: {
			question: xform.currentState.children[questionNumber] as SelectNode,
		},
		global: { ...globalMountOptions, provide: { submitPressed } },
		attachTo: document.body,
	});

	return { xform, component };
};

describe('SelectControl', () => {
	it('shows radio buttons for select1', async () => {
		const { xform, component } = await mountComponent(0);
		const nodeId = xform.currentState.children[0].nodeId;

		const cherry: DOMWrapper<HTMLInputElement> = component.find(`input[id="${nodeId}_cherry"]`);
		const mango: DOMWrapper<HTMLInputElement> = component.find(`input[id="${nodeId}_mango"]`);

		expect(cherry.element.type).toEqual('radio');
		expect(cherry.element.checked).toBe(true);

		await mango.trigger('click');

		expect(cherry.element.checked).toBe(false);
		expect(mango.element.checked).toBe(true);
	});

	it('shows checkboxes for select many', async () => {
		const { xform, component } = await mountComponent(1);
		const nodeId = xform.currentState.children[1].nodeId;

		const watermelon: DOMWrapper<HTMLInputElement> = component.find(
			`input[id="${nodeId}_watermelon"]`
		);
		const peach: DOMWrapper<HTMLInputElement> = component.find(`input[id="${nodeId}_peach"]`);

		expect(watermelon.element.type).toEqual('checkbox');
		expect(watermelon.element.checked).toBe(false);
		expect(peach.element.checked).toBe(true);

		await watermelon.trigger('click');
		await peach.trigger('click');

		expect(watermelon.element.checked).toBe(true);
		expect(peach.element.checked).toBe(false);
	});

	describe('validation', () => {
		it('does not show validation message on init', async () => {
			const { component } = await mountComponent(0);
			expect(component.get('.validation-message').isVisible()).toBe(false);
		});

		it('shows validation message for invalid state', async () => {
			const { component } = await mountComponent(4, '1-validation.xml');
			const pakistan = component.find('input[id*=_pk]');
			await pakistan.setValue();
			expect(component.get('.validation-message').isVisible()).toBe(true);
			expect(component.get('.validation-message').text()).toBe('It has to be two');
		});

		it('hides validation message when user enters a valid value', async () => {
			const { component } = await mountComponent(4, '1-validation.xml');
			const pakistan = component.find('input[id*=_pk]');
			await pakistan.setValue();
			const canada = component.find('input[id*=_ca]');
			await canada.setValue();
			expect(component.get('.validation-message').text()).toBe('');
		});

		it('shows validation message on submit pressed even when no interaction is made with the component', async () => {
			const { component } = await mountComponent(4, '1-validation.xml', true);
			expect(component.get('.validation-message').isVisible()).toBe(true);
			expect(component.get('.validation-message').text()).toBe('Condition not satisfied: required');
		});
	});
});
