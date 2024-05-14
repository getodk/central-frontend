import { initializeForm, type AnyLeafNode, type RootNode } from '@odk-web-forms/xforms-engine';
import type { MountingOptions } from '@vue/test-utils';
import PrimeVue from 'primevue/config';
import { assocPath } from 'ramda';
import { reactive } from 'vue';

const formFixtures = import.meta.glob<true, 'raw', string>(
	'../../ui-solid/fixtures/xforms/**/*.xml',
	{
		query: '?raw',
		import: 'default',
		eager: true,
	}
);

export const getReactiveForm = async (formPath: string): Promise<RootNode> => {
	const formXml: string = formFixtures[`../../ui-solid/fixtures/xforms/${formPath}`];

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
