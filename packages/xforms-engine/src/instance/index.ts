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

const identity = <T>(value: T): T => value;

const getInstanceConfig = (
	options: Partial<InitializeFormOptions['config']> = {}
): InstanceConfig => {
	return {
		createUniqueId,
		fetchResource: options.fetchResource ?? fetch,
		stateFactory: options.stateFactory ?? identity,
	};
};

export const initializeForm = async (
	input: FormResource,
	options: Partial<InitializeFormOptions> = {}
): Promise<RootNode> => {
	const engineConfig = getInstanceConfig(options.config);
	const sourceXML = await retrieveSourceXMLResource(input, engineConfig);
	const form = new XFormDefinition(sourceXML);

	// @ts-expect-error - it won't be an abstract class forever
	return new Root(form, engineConfig) as Root;
};

initializeForm satisfies InitializeForm;
