import type { InstanceAttachmentsConfig } from '../attachments/InstanceAttachmentsConfig.ts';
import type { OpaqueReactiveObjectFactory } from '../OpaqueReactiveObjectFactory.ts';

/**
 * @see https://getodk.github.io/xforms-spec/#preload-attributes
 */
export interface PreloadProperties {
	/**
	 * The unique identifier for this device. If not provided, then an identifier will be
	 * generated during the first page load and stored in localstorage and reused for
	 * subsequent form loads.
	 */
	readonly deviceID?: string;
	readonly email?: string;
	readonly username?: string;
	readonly phoneNumber?: string;
}

export interface GeolocationProvider {
	getLocation(): Promise<string>;
}

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

	readonly preloadProperties?: PreloadProperties;

	readonly geolocationProvider?: GeolocationProvider;
}
