import FormHeader from '@/components/form-layout/FormHeader.vue';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { getReactiveForm } from '../../helpers.ts';
import PrimeVue from 'primevue/config';

describe('FormHeader', () => {
	it('shows form title', async () => {
		const xform = await getReactiveForm('1-calculate-simple.xform.xml');

		const component = mount(FormHeader, {
			props: {
				form: xform,
			},
			global: {
				plugins: [PrimeVue],
			},
		});

		expect(component.find('.form-title').text()).toBe('Calculate (simple)');
	});
});
