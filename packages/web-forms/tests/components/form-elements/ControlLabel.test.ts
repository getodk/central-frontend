import ControlLabel from '@/components/form-elements/ControlLabel.vue';
import type { AnyInputNode } from '@getodk/xforms-engine';
import { mount } from '@vue/test-utils';
import { assocPath } from 'ramda';
import { describe, expect, it } from 'vitest';

const baseQuestion = {
	nodeType: 'input',
	currentState: {
		required: true,
		label: {
			formatted: [{ role: 'child', value: 'First Name' }],
		},
	},
} as AnyInputNode;

describe('ControlLabel', () => {
	it('styles field when required', () => {
		const component = mount(ControlLabel, {
			props: {
				question: baseQuestion,
			},
		});

		expect(component.classes().includes('required')).toBe(true);
	});

	it('does not style field when not required', () => {
		const component = mount(ControlLabel, {
			props: {
				question: assocPath(['currentState', 'required'], false, baseQuestion),
			},
		});

		expect(component.classes().includes('required')).toBe(false);
	});
});
