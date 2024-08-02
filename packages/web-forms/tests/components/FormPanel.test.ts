import FormPanel, { type PanelProps } from '@/components/FormPanel.vue';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { globalMountOptions } from '../helpers';

const mountComponent = (props: PanelProps) => {
	return mount(FormPanel, {
		props, // eslint-disable-line @typescript-eslint/no-unsafe-assignment
		global: globalMountOptions,
	});
};

describe('FormPanel', () => {
	it('does not render PrimeVue Panel if noUI is true', () => {
		const component = mountComponent({
			noUi: true,
		});

		expect(component.html()).toBe('');
	});

	it('does not render context button if there is no menu items', () => {
		const component = mountComponent({
			title: 'Test Panel',
		});

		expect(component.find('.btn-context').exists()).toBe(false);
	});

	it('shows title', () => {
		const component = mountComponent({
			title: 'Test Panel',
		});

		expect(component.find('.panel-title').text()).toBe('Test Panel');
	});

	it('shows provided menu items in context menu', async () => {
		const component = mountComponent({
			title: 'Test Panel',
			menuItems: [{ label: 'Remove', icon: 'icon-delete' }],
		});

		await component.find('.btn-context').trigger('click');

		expect(component.findAll('.p-menu.p-component li').length).toBe(1);
		expect(component.find('.p-menu.p-component').text()).toBe('Remove');
	});
});
