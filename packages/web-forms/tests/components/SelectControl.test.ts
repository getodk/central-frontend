import SelectControl from '@/components/controls/SelectControl.vue';
import type { SelectNode } from '@getodk/xforms-engine';
import { DOMWrapper, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { getReactiveForm, globalMountOptions } from '../helpers';

const mountComponent = async (questionNumber: number) => {
	const xform = await getReactiveForm('select/1-static-selects.xml');

	const component = mount(SelectControl, {
		props: {
			question: xform.currentState.children[questionNumber] as SelectNode,
		},
		global: globalMountOptions,
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
});
