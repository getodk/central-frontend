import type { OpaqueReactiveObjectFactory } from './OpaqueReactiveObjectFactory.ts';

/**
 * @todo this is currently a strict subset of the web standard `Response`. Is it
 * sufficient? Ways it might not be:
 *
 * - No way to convey metadata about the resource
 * - Ambiguous if a client supplies an alternative implementation which doesn't
 *   exhaust the body on access
 */
export interface FetchResourceResponse {
	readonly ok?: boolean;
	readonly body?: ReadableStream<Uint8Array> | null;
	readonly bodyUsed?: boolean;

	readonly blob: () => Promise<Blob>;
	readonly text: () => Promise<string>;
}

/**
 * @todo this is a strict subset of the web standard `fetch` interface. It
 * implicitly assumes that the engine itself will only ever issue `GET`-like
 * requests. It also provides no further request-like semantics to the engine.
 * This is presumed sufficient for now, but notably doesn't expose any notion of
 * content negotiation (e.g. the ability to supply `Accept` headers).
 *
 * This also completely ignores any notion of mapping
 * {@link https://getodk.github.io/xforms-spec/#uris | `jr:` URLs} to their
 * actual resources (likely, but not necessarily, accessed at a corresponding
 * HTTP URL).
 */
export type FetchResource = (resource: URL) => Promise<FetchResourceResponse>;

/**
 * Options provided by a client to specify certain aspects of engine runtime
 * behavior. These options will generally be intended to facilitate cooperation
 * where there is mixed responsibility between a client and the engine, or where
 * the engine may provide sensible defaults which a client could be expected to
 * override or augment.
 */
export interface EngineConfig {
	/**
	 * A client may specify a generic function for constructing stateful objects.
	 * The only hard requirement of this function is that it accepts an **object**
	 * and returns an object of the same shape. The engine will use this function
	 * to initialize client-facing state, and will mutate properties of the object
	 * when their corresponding state is changed.
	 *
	 * A client may use this function to provide its own implementation of
	 * reactivity with semantics like those described above. The mechanism of
	 * reactivity, if any, is at the discretion of the client. It is expected
	 * that clients providing this function will use a reactive subscribe-on-read
	 * mechanism to handle state updates conveyed by the engine.
	 */
	readonly stateFactory?: OpaqueReactiveObjectFactory;

	/**
	 * A client may specify a generic function for retrieving resources referenced
	 * by a form, such as:
	 *
	 * - Form definitions themselves (if not provided directly to the engine by
	 *   the client)
	 * - External secondary instances
	 * - Media (images, audio, video, etc.)
	 *
	 * The function is expected to be a subset of the
	 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API | Fetch API},
	 * performing `GET` requests for:
	 *
	 * - Text resources (e.g. XML, CSV, JSON/GeoJSON)
	 * - Binary resources (e.g. media)
	 * - Optionally streamed binary data of either (e.g. for optimized
	 *   presentation of audio/video)
	 *
	 * If provided by a client, this function will be used by the engine to
	 * retrieve any such resource, as required for engine functionality. If
	 * absent, the engine will use the native `fetch` function (if available, a
	 * polyfill otherwise). Clients may use this function to provide resources
	 * from sources other than the network, (or even in a test client to provide
	 * e.g. resources from test fixtures).
	 */
	readonly fetchResource?: FetchResource;
}
