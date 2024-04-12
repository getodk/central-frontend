import OdkGroup from '@/components/OdkGroup.vue';
import OdkRepeat from '@/components/OdkRepeat.vue';
import OdkRepeatInstance from '@/components/OdkRepeatInstance.vue';
import { initializeForm, type RepeatRangeNode } from '@odk-web-forms/xforms-engine';
import { mount } from '@vue/test-utils';
// eslint-disable-next-line no-restricted-imports -- in test environemnt
import { readFile } from 'fs/promises';
import PrimeVue from 'primevue/config';
import { describe, expect, it } from 'vitest';
import { reactive } from 'vue';

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

	return mount(OdkRepeat, {
		props: {
			question: xform.currentState.children[0] as RepeatRangeNode,
		},
		global: {
			plugins: [[PrimeVue, { ripple: false }]],
			stubs: {
				teleport: true,
			},
		},
	});
};

describe('OdkRepeat', () => {
	it('shows label of RepeatRange', async () => {
		const component = await mountComponent('09-repeat-with-dynamic-label.xml');

		expect(component.find('h2:first-of-type').text()).to.be.eql('Repeat label');
	});

	it('adds a new instance', async () => {
		const component = await mountComponent('09-repeat-with-dynamic-label.xml');

		expect(component.findAllComponents(OdkRepeatInstance).length).to.be.eql(1);

		await component.find('button[aria-label="Add"]').trigger('click');

		expect(component.findAllComponents(OdkRepeatInstance).length).to.be.eql(2);
	});

	it('removes an instance', async () => {
		const component = await mountComponent('09-repeat-with-dynamic-label.xml');

		expect(component.findAllComponents(OdkRepeatInstance).length).to.be.eql(1);

		await component.find('button[aria-label="More"]').trigger('click');

		await component.find('li[aria-label="Remove"] a').trigger('click');

		expect(component.findAllComponents(OdkRepeatInstance).length).to.be.eql(0);
	});

	it('coalesces group if it is the only child', async () => {
		const component = await mountComponent('09-repeat-with-dynamic-label.xml');

		const instance = component.findComponent(OdkRepeatInstance);

		expect(instance.findComponent(OdkGroup).exists()).to.be.false;
	});

	it('does not coalesces group if there are other children', async () => {
		const component = await mountComponent('10-repeat-with-multiple-children.xml');

		const instance = component.findComponent(OdkRepeatInstance);

		expect(instance.findComponent(OdkGroup).exists()).to.be.true;
	});
});
