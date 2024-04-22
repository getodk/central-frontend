import InputText from '@/components/controls/InputText.vue';
import UnsupportedControl from '@/components/controls/UnsupportedControl.vue';
import type { StringNode } from '@odk-web-forms/xforms-engine';
import { mount } from '@vue/test-utils';
import { assocPath } from 'ramda';
import { describe, expect, it } from 'vitest';
import FormQuestion from '../../src/components/FormQuestion.vue';

const baseQuestion = {
	nodeType: 'string',
	currentState: {
		required: true,
		label: {
			asString: 'First Name',
		},
	},
} as StringNode;

describe('FormQuestion', () => {
	it('shows InputText control for string nodes', () => {
		const component = mount(FormQuestion, {
			props: {
				question: baseQuestion,
			},
		});

		const inputText = component.findComponent(InputText);

		expect(inputText.exists()).toBe(true);

		expect(component.text()).toBe('* First Name');
	});

	it('shows UnsupportedControl for unsupported / unimplemented question type', () => {
		const component = mount(FormQuestion, {
			props: {
				question: assocPath(['nodeType'], 'select', baseQuestion),
			},
		});

		const unsupported = component.findComponent(UnsupportedControl);

		expect(unsupported.exists()).toBe(true);

		expect(component.text()).toBe('Unsupported field {select} in the form definition.');
	});
});
