import InputControl from '@/components/form-elements/input/InputControl.vue';
import RankControl from '@/components/form-elements/RankControl.vue';
import SelectControl from '@/components/form-elements/select/SelectControl.vue';
import FormQuestion from '@/components/form-layout/FormQuestion.vue';
import { IS_FORM_EDIT_MODE } from '@/lib/constants/injection-keys.ts';
import type { SelectNode } from '@getodk/xforms-engine';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { shallowRef } from 'vue';
import { getReactiveForm, globalMountOptions } from '../../helpers.ts';

const mountComponent = async (formPath: string, questionNumber: number) => {
	const xform = await getReactiveForm(formPath);

	return mount(FormQuestion, {
		props: {
			question: xform.currentState.children[questionNumber] as SelectNode,
		},
		global: {
			...globalMountOptions,
			provide: { [IS_FORM_EDIT_MODE]: shallowRef(false) },
		},
	});
};

describe('FormQuestion', () => {
	it('shows InputControl control for string nodes', async () => {
		const component = await mountComponent('minimal.xform.xml', 0);

		const inputControl = component.findComponent(InputControl);

		expect(inputControl.exists()).toBe(true);

		expect(component.text()).toBe('First question');
	});

	it('shows Select control for select nodes', async () => {
		const component = await mountComponent('1-static-selects.xml', 0);

		const selectControl = component.findComponent(SelectControl);

		expect(selectControl.exists()).toBe(true);

		expect(component.find('label').text()).toEqual('Select a fruit');
	});

	it('shows Rank control for rank nodes', async () => {
		const component = await mountComponent('1-rank.xml', 0);

		const rankControl = component.findComponent(RankControl);

		expect(rankControl.exists()).toBe(true);

		expect(component.find('label').text()).toEqual('What values guide your decision-making?');
		expect(component.find('#creativity_and_innovation .rank-label').text()).toEqual(
			'Creativity and Innovation'
		);
		expect(component.find('#family_and_friends .rank-label').text()).toEqual('Family and Friends');
	});
});
