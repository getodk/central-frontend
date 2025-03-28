import type { InstanceAttachmentsConfig } from '../attachments/InstanceAttachmentsConfig.ts';
import type { OpaqueReactiveObjectFactory } from '../OpaqueReactiveObjectFactory.ts';

export interface FormInstanceConfig {
	/**
	 * A client may specify a generic function for constructing stateful objects.
	 * The only hard requirement of this function is that it accepts an **object**
	 * and returns an object of the same shape. The engine will use this function
	 * to initialize client-facing state, and will mutate properties of the object
	 * when their corresponding state is changed.
	 *
	 * A client may use this function to provide its own implementation of
	 * reactivity with semantics like those described above. The mechanism of
	 * reactivity, if any, is at the discretion of the client. It is expected that
	 * clients providing this function will use a reactive subscribe-on-read
	 * mechanism to handle state updates conveyed by the engine.
	 */
	readonly stateFactory?: OpaqueReactiveObjectFactory;

	readonly instanceAttachments?: InstanceAttachmentsConfig;
}
