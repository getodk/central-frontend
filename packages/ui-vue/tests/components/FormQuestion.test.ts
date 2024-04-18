import InputText from '@/components/controls/InputText.vue';
import SelectControl from '@/components/controls/SelectControl.vue';
import UnsupportedControl from '@/components/controls/UnsupportedControl.vue';
import type { AnyLeafNode, SelectNode } from '@odk-web-forms/xforms-engine';
import { mount } from '@vue/test-utils';
import { assocPath } from 'ramda';
import { describe, expect, it } from 'vitest';
import FormQuestion from '../../src/components/FormQuestion.vue';
import { getReactiveForm, globalMountOptions } from '../helpers';

const mountComponent = async (formPath: string, questionNumber: number) => {
	const xform = await getReactiveForm(formPath);

	return mount(FormQuestion, {
		props: {
			question: xform.currentState.children[questionNumber] as SelectNode,
		},
		global: globalMountOptions,
	});
};

describe('FormQuestion', () => {
	it('shows InputText control for string nodes', async () => {
		const component = await mountComponent('minimal.xform.xml', 0);

		const inputText = component.findComponent(InputText);

		expect(inputText.exists()).toBe(true);

		expect(component.text()).toBe('First question');
	});

	it('shows Select control for select nodes', async () => {
		const component = await mountComponent('select/1-static-selects.xml', 0);

		const selectControl = component.findComponent(SelectControl);

		expect(selectControl.exists()).to.be.true;

		expect(component.find('label').text()).to.be.eql('1. Select a fruit');
	});

	it('shows UnsupportedControl for unsupported / unimplemented question type', () => {
		const component = mount(FormQuestion, {
			props: {
				question: assocPath(['nodeType'], 'dummy', {} as AnyLeafNode),
			},
		});

		const unsupported = component.findComponent(UnsupportedControl);

		expect(unsupported.exists()).toBe(true);

		expect(component.text()).to.be.eql('Unsupported field {dummy} in the form definition.');
	});
});
