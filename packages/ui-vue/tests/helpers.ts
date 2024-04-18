import { initializeForm, type RootNode } from '@odk-web-forms/xforms-engine';
// eslint-disable-next-line no-restricted-imports -- in test environemnt
import { readFile } from 'fs/promises';
import { reactive } from 'vue';
import PrimeVue from 'primevue/config';
import type { MountingOptions } from '@vue/test-utils';

export const getReactiveForm = async (formPath: string): Promise<RootNode> => {
	const formXml = await readFile(`../ui-solid/fixtures/xforms/${formPath}`, 'utf8');

	return await initializeForm(formXml, {
		config: {
			stateFactory: <T extends object>(o: T) => {
				return reactive(o) as T;
			},
		},
	});
};

type GlobalMountOptions = Required<MountingOptions<unknown>>['global'];

export const globalMountOptions: GlobalMountOptions = {
	plugins: [[PrimeVue, { ripple: false }]],
	stubs: {
		teleport: true,
	},
};
