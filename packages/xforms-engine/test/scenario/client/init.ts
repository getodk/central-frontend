import type { JRResourceService } from '@getodk/common/jr-resources/JRResourceService.ts';
import type {
	FormResource,
	GeolocationProvider,
	InstanceAttachmentsConfig,
	LoadFormOptions,
	LoadFormSuccessResult,
	LoadFormWarningResult,
	MissingResourceBehavior,
	OpaqueReactiveObjectFactory,
	PreloadProperties,
	ResolvedFormInstanceInputType,
	RootNode,
} from '@getodk/xforms-engine';
import { createInstance, editInstance } from '@getodk/xforms-engine';
import type { Owner } from 'solid-js';
import { createRoot } from 'solid-js';
import { getAssertedOwner, runInSolidScope } from './solid-helpers.ts';

import { constants, type InstanceData } from '@getodk/xforms-engine';

const { INSTANCE_FILE_NAME, INSTANCE_FILE_TYPE } = constants;

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
	readonly preloadProperties: PreloadProperties;
	readonly geolocationProvider: GeolocationProvider;
	readonly editInstance: string | null;
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
			const initOptions = {
				form: {
					...defaultConfig,
					fetchFormAttachment: options.resourceService.handleRequest,
					missingResourceBehavior: options.missingResourceBehavior,
				},
				instance: {
					stateFactory: options.stateFactory,
					instanceAttachments: options.instanceAttachments,
					preloadProperties: options.preloadProperties,
					geolocationProvider: options.geolocationProvider,
				},
			};
			if (options.editInstance) {
				const instanceFile = new File([options.editInstance], INSTANCE_FILE_NAME, {
					type: INSTANCE_FILE_TYPE,
				});
				const instanceData = new FormData();
				instanceData.set(INSTANCE_FILE_NAME, instanceFile);
				const instance = {
					inputType: 'FORM_INSTANCE_INPUT_RESOLVED' as ResolvedFormInstanceInputType,
					data: [instanceData as InstanceData] as const,
				};
				return editInstance(formResource, instance, initOptions);
			}
			return createInstance(formResource, initOptions);
		});

		return {
			form,
			instanceRoot,
			owner,
			dispose,
		};
	});
};
