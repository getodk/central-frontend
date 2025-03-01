import { identity } from '@getodk/common/lib/identity.ts';
import type {
	FormInstance as ClientFormInstance,
	FormInstanceInitializationMode,
} from '../client/form/FormInstance.ts';
import type { FormInstanceConfig } from '../client/index.ts';
import type { InstanceConfig } from '../instance/internal-api/InstanceConfig.ts';
import type { PrimaryInstanceOptions } from '../instance/PrimaryInstance.ts';
import { PrimaryInstance } from '../instance/PrimaryInstance.ts';
import type { Root } from '../instance/Root.ts';
import type { FormSuccessResult } from './FormResult/FormSuccessResult.ts';
import type { FormWarningResult } from './FormResult/FormWarningResult.ts';

// prettier-ignore
export type InstantiableFormResult =
	| FormSuccessResult
	| FormWarningResult;

export interface FormInstanceBaseOptions extends Omit<PrimaryInstanceOptions, 'config'> {}

interface FormInstanceOptions<Mode extends FormInstanceInitializationMode> {
	readonly mode: Mode;
	readonly instanceOptions: FormInstanceBaseOptions;
	readonly instanceConfig: FormInstanceConfig;
}

export class FormInstance<Mode extends FormInstanceInitializationMode>
	implements ClientFormInstance<Mode>
{
	readonly mode: Mode;
	readonly root: Root;

	constructor(
		readonly formResult: InstantiableFormResult,
		options: FormInstanceOptions<Mode>
	) {
		const config: InstanceConfig = {
			clientStateFactory: options.instanceConfig.stateFactory ?? identity,
		};
		const primaryInstanceOptions: PrimaryInstanceOptions = {
			...options.instanceOptions,
			config,
		};
		const { root } = new PrimaryInstance(primaryInstanceOptions);

		this.mode = options.mode;
		this.root = root;
	}
}
