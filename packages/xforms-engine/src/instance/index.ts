import { identity } from '@getodk/common/lib/identity.ts';
import { getOwner } from 'solid-js';
import type { EngineConfig } from '../client/EngineConfig.ts';
import type { RootNode } from '../client/RootNode.ts';
import type {
	InitializeFormOptions as BaseInitializeFormOptions,
	FormResource,
	InitializeForm,
} from '../client/index.ts';
import { retrieveSourceXMLResource } from '../instance/resource.ts';
import { createReactiveScope } from '../lib/reactivity/scope.ts';
import { createUniqueId } from '../lib/unique-id.ts';
import { XFormDOM } from '../parse/XFormDOM.ts';
import { XFormDefinition } from '../parse/XFormDefinition.ts';
import { SecondaryInstancesDefinition } from '../parse/model/SecondaryInstance/SecondaryInstancesDefinition.ts';
import { PrimaryInstance } from './PrimaryInstance.ts';
import type { InstanceConfig } from './internal-api/InstanceConfig.ts';

interface InitializeFormOptions extends BaseInitializeFormOptions {
	readonly config: Partial<InstanceConfig>;
}

const buildInstanceConfig = (options: EngineConfig = {}): InstanceConfig => {
	return {
		createUniqueId,
		fetchFormDefinition: options.fetchFormDefinition ?? options.fetchResource ?? fetch,
		fetchFormAttachment: options.fetchFormAttachment ?? fetch,
		stateFactory: options.stateFactory ?? identity,
	};
};

export const initializeForm = async (
	input: FormResource,
	options: Partial<InitializeFormOptions> = {}
): Promise<RootNode> => {
	const owner = getOwner();
	const scope = createReactiveScope({ owner });
	const engineConfig = buildInstanceConfig(options.config);
	const sourceXML = await retrieveSourceXMLResource(input, {
		fetchResource: engineConfig.fetchFormDefinition,
	});
	const xformDOM = XFormDOM.from(sourceXML);
	const secondaryInstances = await SecondaryInstancesDefinition.load(xformDOM, {
		fetchResource: engineConfig.fetchFormAttachment,
	});
	const form = new XFormDefinition(xformDOM);
	const primaryInstance = new PrimaryInstance(scope, form.model, secondaryInstances, engineConfig);

	return primaryInstance.root;
};

initializeForm satisfies InitializeForm;
