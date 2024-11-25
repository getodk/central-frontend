import type { OpaqueReactiveObjectFactory } from '../../client/OpaqueReactiveObjectFactory.ts';
import type { FetchFormAttachment, FetchResource } from '../../client/resources.ts';
import type { CreateUniqueId } from '../../lib/unique-id.ts';

export interface InstanceConfig {
	readonly stateFactory: OpaqueReactiveObjectFactory;
	readonly fetchFormDefinition: FetchResource;
	readonly fetchFormAttachment: FetchFormAttachment;

	/**
	 * Uniqueness per form instance session (so e.g. persistence isn't necessary).
	 */
	readonly createUniqueId: CreateUniqueId;
}
