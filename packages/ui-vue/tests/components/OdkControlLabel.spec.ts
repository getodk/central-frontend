import type { StringNode } from '@odk-web-forms/xforms-engine';
import { mount } from '@vue/test-utils';
import { assocPath } from 'ramda';
import { describe, expect, it } from 'vitest';
import OdkControlLabel from '../../src/components/OdkControlLabel.vue';

const baseQuestion = {
	nodeType: 'string',
	currentState: {
		required: true,
		label: {
			asString: 'First Name',
		},
	},
} as StringNode;

describe('OdkControlLabel', () => {
	it('shows asterisk with field is required', () => {
		const component = mount(OdkControlLabel, {
			props: {
				question: baseQuestion,
			},
		});

		const requireSpan = component.find('label span');

		expect(requireSpan.exists()).to.be.true;
		expect(requireSpan.text()).to.be.eql('*');

		expect(component.text()).to.be.eql('* First Name');
	});

	it('does not show asterisk when field is not required', () => {
		const component = mount(OdkControlLabel, {
			props: {
				question: assocPath(['currentState', 'required'], false, baseQuestion),
			},
		});

		const requireSpan = component.find('label span');

		expect(requireSpan.exists()).to.be.false;

		expect(component.text()).to.be.eql('First Name');
	});
});
