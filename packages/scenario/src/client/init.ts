import type { XFormsElement } from '@getodk/common/test/fixtures/xform-dsl/XFormsElement.ts';
import type {
	EngineConfig,
	FormResource,
	OpaqueReactiveObjectFactory,
	RootNode,
} from '@getodk/xforms-engine';
import { initializeForm } from '@getodk/xforms-engine';
import type { Owner } from 'solid-js';
import { createRoot, getOwner, runWithOwner } from 'solid-js';
import { FormDefinitionResource } from '../jr/resource/FormDefinitionResource.ts';

/**
 * @todo It's anticipated that this will be expanded to support the various ways
 * that JavaRosa's tests load form resources. This initially supports the (also
 * ported) in-source DSL. We'll likely also need to support loading fixtures by
 * file name (and various ambiguities that come with that, which we may want to
 * disambiguate as we port).
 */
export type TestFormResource = FormDefinitionResource | XFormsElement;

const isPathResource = (resource: TestFormResource): resource is FormDefinitionResource => {
	return resource instanceof FormDefinitionResource;
};

const isXFormsElement = (resource: TestFormResource): resource is XFormsElement => {
	return typeof (resource as XFormsElement).asXml === 'function';
};

export const getFormResource = async (
	testFormResource: TestFormResource
	// It's also anticipated that we will need to perform async IO as we expand
	// the `TestFormResource` type.
	// eslint-disable-next-line @typescript-eslint/require-await
): Promise<FormResource> => {
	if (isPathResource(testFormResource)) {
		return testFormResource.textContents;
	}

	if (isXFormsElement(testFormResource)) {
		return testFormResource.asXml();
	}

	throw new Error('Unknown test form resource');
};

/**
 * @todo Currently we stub resource fetching. We can address this as needed
 * while we port existing tests and/or add new ones which require it.
 */
const fetchResourceStub: typeof fetch = () => {
	throw new Error('TODO: resource fetching not implemented');
};

export interface InitializeTestFormOptions {
	readonly stateFactory: OpaqueReactiveObjectFactory;
}

const defaultConfig = {
	fetchResource: fetchResourceStub,
} as const satisfies Omit<EngineConfig, 'stateFactory'>;

interface InitializedTestForm {
	readonly instanceRoot: RootNode;
	readonly owner: Owner;
	readonly dispose: VoidFunction;
}

export const initializeTestForm = async (
	testForm: TestFormResource,
	options: InitializeTestFormOptions
): Promise<InitializedTestForm> => {
	return createRoot(async (dispose) => {
		const owner = getOwner();

		if (owner == null) {
			throw new Error('Must have reactive context owner');
		}

		const formResource = await getFormResource(testForm);
		const instanceRoot = await runWithOwner(owner, async () => {
			return initializeForm(formResource, {
				config: {
					...defaultConfig,
					stateFactory: options.stateFactory,
				},
			});
		})!;

		return {
			instanceRoot,
			owner,
			dispose,
		};
	});
};
