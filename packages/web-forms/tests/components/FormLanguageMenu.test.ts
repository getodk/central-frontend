import FormLanguageMenu from '@/components/FormLanguageMenu.vue';
import type { FormLanguage, SyntheticDefaultLanguage } from '@getodk/xforms-engine';
import { mount } from '@vue/test-utils';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getReactiveForm, globalMountOptions } from '../helpers';

const isFormLanguage = (lang: FormLanguage | SyntheticDefaultLanguage): lang is FormLanguage => {
	return !lang.isSyntheticDefault;
};

const mountComponent = async (formPath: string) => {
	const xform = await getReactiveForm(formPath);

	const component = mount(FormLanguageMenu, {
		props: {
			activeLanguage: xform.currentState.activeLanguage,
			languages: xform.languages.filter(isFormLanguage),
		},
		emit: {},
		global: globalMountOptions,
	});

	return { xform, component };
};

describe('LanguageChanger', () => {
	let isMatchMediaMocked = false;

	beforeAll(() => {
		// PrimeVue's Select needs matchMedia, which isn't available
		// when running in test-node:jsdom mode
		if (window.matchMedia == null) {
			isMatchMediaMocked = true;

			Object.defineProperty(window, 'matchMedia', {
				writable: true,
				value: () => ({
					matches: false,
					media: null,
					onchange: null,
					addEventListener: () => false,
					removeEventListener: () => false,
					dispatchEvent: () => false,
				}),
			});
		}
	});

	afterAll(() => {
		if (isMatchMediaMocked) {
			Object.defineProperty(window, 'matchMedia', { writable: true, value: undefined });
		}
	});

	it('does not show the dropdown when there is no user defined lang in the form', async () => {
		const { xform, component } = await mountComponent('1-calculate-simple.xform.xml');

		expect(xform.currentState.activeLanguage.isSyntheticDefault).toBe(true);
		expect(xform.languages.filter(isFormLanguage).length).toBe(0);

		expect(component.text()).toBe('');
	});

	it('changes the language', async () => {
		const { xform, component } = await mountComponent('01-itext-basic.xml');

		expect(component.find('.p-select-label').text()).toEqual('English');
		expect(xform.currentState.activeLanguage.language).toEqual('English');

		await component.trigger('click');

		await component.find('li[aria-posinset="2"]').trigger('mousedown');

		xform.setLanguage(component.emitted<FormLanguage[]>('update:activeLanguage')![0][0]);
		expect(xform.currentState.activeLanguage.language).toEqual('Español');

		await component.setProps({ activeLanguage: xform.currentState.activeLanguage });
		expect(component.find('.p-select-label').text()).toEqual('Español');
	});
});
