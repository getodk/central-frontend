import { DOMWrapper, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import SelectControl from '@/components/controls/SelectControl.vue';
import { getReactiveForm, globalMountOptions } from '../helpers';
import type { SelectNode } from '@odk-web-forms/xforms-engine';

const mountComponent = async (questionNumber: number) => {
	const xform = await getReactiveForm('select/1-static-selects.xml');

	return mount(SelectControl, {
		props: {
			question: xform.currentState.children[questionNumber] as SelectNode,
		},
		global: globalMountOptions,
	});
};

describe('SelectControl', () => {
	it('shows radio buttons for select1', async () => {
		const component = await mountComponent(0);
		const cherry: DOMWrapper<HTMLInputElement> = component.find('input[value="cherry"]');
		const mango: DOMWrapper<HTMLInputElement> = component.find('input[value="mango"]');

		expect(cherry.element.type).toEqual('radio');
		expect(cherry.element.checked).toBe(true);

		await mango.trigger('click');

		expect(cherry.element.checked).toBe(false);
		expect(mango.element.checked).toBe(true);
	});

	it('shows checkboxes for select many', async () => {
		const component = await mountComponent(1);

		const watermelon: DOMWrapper<HTMLInputElement> = component.find('input[value="watermelon"]');
		const peach: DOMWrapper<HTMLInputElement> = component.find('input[value="peach"]');

		expect(watermelon.element.type).toEqual('checkbox');
		expect(watermelon.element.checked).toBe(false);
		expect(peach.element.checked).toBe(true);

		await watermelon.trigger('click');
		await peach.trigger('click');

		expect(watermelon.element.checked).toBe(true);
		expect(peach.element.checked).toBe(false);
	});
});
