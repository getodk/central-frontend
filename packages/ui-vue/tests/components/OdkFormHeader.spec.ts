import OdkFormHeader from '@/components/OdkFormHeader.vue';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

describe('OdkFormHeader', () => {
	it('shows form title', () => {
		const component = mount(OdkFormHeader, {
			props: {
				title: 'Test Form',
			},
		});

		expect(component.text()).to.be.eql('Test Form');
	});
});
