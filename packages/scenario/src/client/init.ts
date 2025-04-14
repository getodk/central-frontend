import type { JRResourceService } from '@getodk/common/jr-resources/JRResourceService.ts';
import type {
	FormResource,
	InstanceAttachmentsConfig,
	LoadFormOptions,
	LoadFormSuccessResult,
	LoadFormWarningResult,
	MissingResourceBehavior,
	OpaqueReactiveObjectFactory,
	RootNode,
} from '@getodk/xforms-engine';
import { createInstance } from '@getodk/xforms-engine';
import type { Owner } from 'solid-js';
import { createRoot } from 'solid-js';
import { getAssertedOwner, runInSolidScope } from './solid-helpers.ts';

/**
 * @todo Currently we stub resource fetching. We can address this as needed
 * while we port existing tests and/or add new ones which require it.
 */
const fetchFormDefinitionStub: typeof fetch = () => {
	throw new Error('TODO: fetching form definition not implemented');
};

export interface TestFormOptions {
	readonly resourceService: JRResourceService;
	readonly missingResourceBehavior: MissingResourceBehavior;
	readonly stateFactory: OpaqueReactiveObjectFactory;
	readonly instanceAttachments: InstanceAttachmentsConfig;
}

const defaultConfig = {
	fetchFormDefinition: fetchFormDefinitionStub,
} as const satisfies LoadFormOptions;

// prettier-ignore
export type InitializableForm =
	| LoadFormSuccessResult
	| LoadFormWarningResult;

interface InitializedTestForm {
	readonly form: InitializableForm;
	readonly instanceRoot: RootNode;
	readonly owner: Owner;
	readonly dispose: VoidFunction;
}

export const initializeTestForm = async (
	formResource: FormResource,
	options: TestFormOptions
): Promise<InitializedTestForm> => {
	return createRoot(async (dispose) => {
		const owner = getAssertedOwner();

		const { formResult: form, root: instanceRoot } = await runInSolidScope(owner, async () => {
			return createInstance(formResource, {
				form: {
					...defaultConfig,
					fetchFormAttachment: options.resourceService.handleRequest,
					missingResourceBehavior: options.missingResourceBehavior,
				},
				instance: {
					stateFactory: options.stateFactory,
					instanceAttachments: options.instanceAttachments,
				},
			});
		});

		return {
			form,
			instanceRoot,
			owner,
			dispose,
		};
	});
};
