import { XFormDefinition } from '../XFormDefinition.ts';
import type { EngineConfig } from '../client/EngineConfig.ts';
import type { RootNode } from '../client/RootNode.ts';
import type { FormResource, InitializeForm, InitializeFormOptions } from '../client/index.ts';
import { retrieveSourceXMLResource } from '../instance/resource.ts';
import { Root } from './Root.ts';

const identity = <T>(value: T): T => value;

const defaultConfig: Required<EngineConfig> = {
	fetchResource: fetch,
	stateFactory: identity,
};

export const initializeForm = async (
	input: FormResource,
	options?: InitializeFormOptions
): Promise<RootNode> => {
	const engineConfig = {
		...defaultConfig,
		...options?.config,
	};
	const sourceXML = await retrieveSourceXMLResource(input, engineConfig);
	const form = new XFormDefinition(sourceXML);

	// @ts-expect-error - it won't be an abstract class forever
	return new Root(form, engineConfig) as Root;
};

initializeForm satisfies InitializeForm;
