import type { FormInstanceConfig } from '../../client/form/FormInstanceConfig.ts';
import type { OpaqueReactiveObjectFactory } from '../../client/OpaqueReactiveObjectFactory.ts';

export interface InstanceConfig {
	/**
	 * @see {@link FormInstanceConfig.stateFactory}
	 */
	readonly clientStateFactory: OpaqueReactiveObjectFactory;
}
