import FormGroup from '@/components/FormGroup.vue';
import RepeatInstance from '@/components/RepeatInstance.vue';
import RepeatRange from '@/components/RepeatRange.vue';
import { initializeForm, type RepeatRangeNode } from '@odk-web-forms/xforms-engine';
import { mount } from '@vue/test-utils';
// eslint-disable-next-line no-restricted-imports -- in test environemnt
import { readFile } from 'fs/promises';
import { describe, expect, it } from 'vitest';
import { reactive } from 'vue';
import { globalMountOptions } from '../helpers';

const mountComponent = async (formName: string) => {
	// Can we move fixtures out of ui-solid?
	const formXml = await readFile(`../ui-solid/fixtures/xforms/repeats/${formName}`, 'utf8');

	const xform = await initializeForm(formXml, {
		config: {
			stateFactory: <T extends object>(o: T) => {
				return reactive(o) as T;
			},
		},
	});

	return mount(RepeatRange, {
		props: {
			node: xform.currentState.children[0] as RepeatRangeNode,
		},
		global: globalMountOptions,
	});
};

describe('RepeatRange', () => {
	it('shows label of RepeatRange', async () => {
		const component = await mountComponent('09-repeat-with-dynamic-label.xml');

		expect(component.find('h2:first-of-type').text()).toBe('Repeat label');
	});

	it('adds a new instance', async () => {
		const component = await mountComponent('09-repeat-with-dynamic-label.xml');

		expect(component.findAllComponents(RepeatInstance).length).toBe(1);

		await component.find('button[aria-label="Add"]').trigger('click');

		expect(component.findAllComponents(RepeatInstance).length).toBe(2);
	});

	it('removes an instance', async () => {
		const component = await mountComponent('09-repeat-with-dynamic-label.xml');

		expect(component.findAllComponents(RepeatInstance).length).toBe(1);

		await component.find('button[aria-label="More"]').trigger('click');

		await component.find('li[aria-label="Remove"] a').trigger('click');

		expect(component.findAllComponents(RepeatInstance).length).toBe(0);
	});

	it('coalesces group if it is the only child', async () => {
		const component = await mountComponent('09-repeat-with-dynamic-label.xml');

		const instance = component.findComponent(RepeatInstance);

		expect(instance.findComponent(FormGroup).exists()).toBe(false);
	});

	it('does not coalesces group if there are other children', async () => {
		const component = await mountComponent('10-repeat-with-multiple-children.xml');

		const instance = component.findComponent(RepeatInstance);

		expect(instance.findComponent(FormGroup).exists()).toBe(true);
	});
});
