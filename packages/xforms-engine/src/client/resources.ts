import type { JRResourceURL } from '@getodk/common/jr-resources/JRResourceURL.ts';
import type { loadForm } from '../entrypoints/loadForm.ts';

interface FetchResourceHeadersIterator<T>
	extends IteratorObject<
		T,
		// Note: we use this weird TypeScript intrinsic type so a built-in
		// `HeadersIterator` is assignable regardless of a client's configured
		// TypeScript or linting strictness. We don't actually care about the type, or
		// consume the value it represents.
		BuiltinIteratorReturn,
		unknown
	> {
	[Symbol.iterator](): FetchResourceHeadersIterator<T>;
}

type FetchResourceHeadersForEachCallbackFn = (
	value: string,
	key: string,
	parent: FetchResourceResponseHeaders
) => void;

/**
 * A read-only strict subset of the web standard {@link Headers}.
 *
 * Note that the engine may make the following assumptions about
 * {@link FetchResourceResponse.headers}:
 *
 * - If {@link FetchResourceResponse} is an instance of {@link Response}, it
 *   will be assumed its {@link FetchResourceResponse.headers | headers object}
 *   _is present_, and that it is an instance of {@link Headers}. In other
 *   words: for the purposes of resource resolution, we explicitly expect that
 *   clients using APIs provided by the runtime platform (or polyfills thereof)
 *   will not monkey-patch properties of values produced by those APIs.
 *
 * - If the object is an instance of {@link Headers} (whether by inference as a
 *   property of {@link Response}, or by a direct instance type check), the
 *   engine will assume it is safe to treat header names as case insensitive for
 *   any lookups it may perform. In other words: we explicitly expect that
 *   clients _providing access_ to APIs rovided by the runtime platform (or
 *   polyfills thereof) will not alter the guarantees of those APIs.
 *
 * - If the object is not an instance of {@link Headers}, it will be treated as
 *   a {@link ReadonlyMap<string, string>}. In other words: we explicitly expect
 *   that clients, when providing a bespoke implementation of
 *   {@link FetchResourceResponse} and its constituent parts, will likely
 *   implement them partially (and in the case of
 *   {@link FetchResourceResponse.headers}, with the nearest common idiom
 *   available). In this case, we will favor a best effort at correctness,
 *   generally at some expense of performance.
 */
export interface FetchResourceResponseHeaders {
	[Symbol.iterator](): FetchResourceHeadersIterator<[string, string]>;

	entries(): FetchResourceHeadersIterator<[string, string]>;
	keys(): FetchResourceHeadersIterator<string>;
	values(): FetchResourceHeadersIterator<string>;

	get(name: string): string | null;
	has(name: string): boolean;
	forEach(callbackfn: FetchResourceHeadersForEachCallbackFn): void;
}

/**
 * This is a strict subset of the web standard {@link Response}. Clients are
 * encouraged to use the global {@link Response} constructor (as provided by the
 * runtime platform, or by a global runtime polyfill), but may also provide a
 * bespoke implementation if it suits their needs.
 *
 * Since we cannot assume a client's implementation will always be an instance
 * of {@link Response}, we make some assumptions about its {@link headers}
 * object (if available, as detailed on {@link FetchResourceResponseHeaders}).
 *
 * For other properties, we make the following assumptions (all of which are
 * assumptions we would make about a platform-provided/polyfilled
 * {@link Response}, but are explicitly stated for the benefit of confidence in
 * client implementations):
 *
 * - If we read {@link body} directly, we will assume it is consumed on first
 *   read, and will not read it again.
 *
 * - We assume that {@link blob} and {@link text} indirectly consume
 *   {@link body} on first read as well, and will only ever read one of each of
 *   these properties, and only ever once.
 *
 * Furthermore, if the engine intends to read {@link body} (or its indirect
 * {@link blob} or {@link text} consumers), it will do so in the course of a
 * client's call to {@link loadForm}, and before the
 * {@link Promise<PrimaryInstance>} returned by that call is resolved.
 */
export interface FetchResourceResponse {
	readonly ok?: boolean;
	readonly status?: number;
	readonly body?: ReadableStream<Uint8Array> | null;
	readonly bodyUsed?: boolean;
	readonly headers?: FetchResourceResponseHeaders;

	readonly blob: () => Promise<Blob>;
	readonly text: () => Promise<string>;
}

/**
 * This is a strict subset of the web standard `fetch` interface. It implicitly
 * assumes that the engine itself will only ever perform `GET`-like network/IO
 * requests. It also provides no further request-like semantics to the engine.
 *
 * This is presumed sufficient for now, but notably doesn't expose any notion of
 * content negotiation (e.g. the ability for the engine to include `Accept`
 * headers in resource requests issued to a client's {@link FetchResource}
 * implementation).
 */
export type FetchResource<Resource extends URL = URL> = (
	resource: Resource
) => Promise<FetchResourceResponse>;

export type FormAttachmentURL = JRResourceURL;

export type FetchFormAttachment = FetchResource<FormAttachmentURL>;
