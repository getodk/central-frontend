import { initializeForm, type AnyLeafNode, type RootNode } from '@odk-web-forms/xforms-engine';
import type { MountingOptions } from '@vue/test-utils';
// eslint-disable-next-line no-restricted-imports -- in test environemnt
import { readFile } from 'fs/promises';
import PrimeVue from 'primevue/config';
import { assocPath } from 'ramda';
import { reactive } from 'vue';

export const getReactiveForm = async (formPath: string): Promise<RootNode> => {
	const formXml = await readFile(`../ui-solid/fixtures/xforms/${formPath}`, 'utf8');

	return await initializeForm(formXml, {
		config: {
			stateFactory: reactive,
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

export const getDummyLeafNode = () => assocPath(['nodeType'], 'dummy', {} as AnyLeafNode);
