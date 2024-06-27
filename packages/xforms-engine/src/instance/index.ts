import { identity } from '@getodk/common/lib/identity.ts';
import { XFormDefinition } from '../XFormDefinition.ts';
import type { RootNode } from '../client/RootNode.ts';
import type {
	InitializeFormOptions as BaseInitializeFormOptions,
	FormResource,
	InitializeForm,
} from '../client/index.ts';
import { retrieveSourceXMLResource } from '../instance/resource.ts';
import { createUniqueId } from '../lib/unique-id.ts';
import { Root } from './Root.ts';
import type { InstanceConfig } from './internal-api/InstanceConfig.ts';

interface InitializeFormOptions extends BaseInitializeFormOptions {
	readonly config: Partial<InstanceConfig>;
}

const buildInstanceConfig = (options: Partial<InstanceConfig> = {}): InstanceConfig => {
	return {
		createUniqueId: options.createUniqueId ?? createUniqueId,
		fetchResource: options.fetchResource ?? fetch,
		stateFactory: options.stateFactory ?? identity,
	};
};

export const initializeForm = async (
	input: FormResource,
	options: Partial<InitializeFormOptions> = {}
): Promise<RootNode> => {
	const engineConfig = buildInstanceConfig(options.config);
	const sourceXML = await retrieveSourceXMLResource(input, engineConfig);
	const form = new XFormDefinition(sourceXML);

	return new Root(form.xformDOM, form.model.root, engineConfig);
};

initializeForm satisfies InitializeForm;
