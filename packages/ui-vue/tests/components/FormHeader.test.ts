import FormHeader from '@/components/FormHeader.vue';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

describe('FormHeader', () => {
	it('shows form title', () => {
		const component = mount(FormHeader, {
			props: {
				title: 'Test Form',
			},
		});

		expect(component.text()).to.be.eql('Test Form');
	});
});
