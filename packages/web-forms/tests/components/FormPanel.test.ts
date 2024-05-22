import FormPanel from '@/components/FormPanel.vue';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { globalMountOptions } from '../helpers';

describe('FormPanel', () => {
	it('does not render PrimeVue Panel if noUI is true', () => {
		const component = mount(FormPanel, {
			props: {
				noUi: true,
			},
		});

		expect(component.html()).toBe('');
	});

	it('does not render context button if there is no menu items', () => {
		const component = mount(FormPanel, {
			props: {
				title: 'Test Panel',
			},
		});

		expect(component.find('.btn-context').exists()).toBe(false);
	});

	it('shows title', () => {
		const component = mount(FormPanel, {
			props: {
				title: 'Test Panel',
			},
		});

		expect(component.find('.panel-title').text()).toBe('Test Panel');
	});

	it('shows provided menu items in context menu', async () => {
		const component = mount(FormPanel, {
			props: {
				title: 'Test Panel',
				menuItems: [{ label: 'Remove', icon: 'icon-delete' }],
			},
			global: globalMountOptions,
		});

		await component.find('.btn-context').trigger('click');

		expect(component.findAll('.p-menu.p-component li').length).toBe(1);
		expect(component.find('.p-menu.p-component').text()).toBe('Remove');
	});
});
