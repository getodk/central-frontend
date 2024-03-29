// Vue's template project used Playwright here, as well as in the /e2e directory.
// Since our other packages are using Vitest for unit/non-e2e-integration tests,
// this is a placeholder for doing that here as well.

import type { AnyLeafNode } from '@odk-web-forms/xforms-engine';
import { mount } from '@vue/test-utils';
import { assocPath } from 'ramda';
import { describe, expect, it } from 'vitest';
import OdkQuestion from '../../src/components/OdkQuestion.vue';

const baseQuestion = {
  currentState: {
    required: true,
    label: {
      asString: 'First Name'
    }
  }
} as any as AnyLeafNode;

describe.only('OdkQuestion', () => {
	it('shows asterisk with field is required', () => {
		const component = mount(OdkQuestion, {
      props: {
        question: baseQuestion
      }
    });

    const requireSpan = component.find('label span');

    expect(requireSpan.exists()).to.be.true;
    expect(requireSpan.text()).to.be.eql('*');

    expect(component.text()).to.be.eql('* First Name');
	});

  it('does not show asterisk when field is not required', () => {
		const component = mount(OdkQuestion, {
      props: {
        question: assocPath(['currentState', 'required'], false, baseQuestion)
      }
    });

    const requireSpan = component.find('label span');

    expect(requireSpan.exists()).to.be.false;

    expect(component.text()).to.be.eql('First Name');
	});
});
