import FormHeader from '@/components/FormHeader.vue';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { getReactiveForm } from '../helpers';

describe('FormHeader', () => {
	it('shows form title', async () => {
		const xform = await getReactiveForm('computations-demo/1-calculate-simple.xform.xml');

		const component = mount(FormHeader, {
			props: {
				form: xform,
			},
		});

		expect(component.find('.form-title').text()).toBe('Calculate (simple)');
	});
});
