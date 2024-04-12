import type { EngineConfig } from './EngineConfig.ts';
import type { RootNode } from './RootNode.ts';

export type FormResource = Blob | URL | string;

export interface InitializeFormOptions {
	readonly config: EngineConfig;

	// E.g. opening a submitted form instance for edit. TDOO: the `FormResource`
	// name is shared here for both init input and initial state, but the shape of
	// those resources would differ. Probably a more generic name is appropriate.
	readonly initialState?: FormResource;
}

/**
 * Creates an instance of a form to be filled (or edited) by a client.
 */
// TODO: initialization is represented as asynchronous here, so that any
// requisite resources can be retrieved before passing control to a client. This
// is an obvious first step, but we can consider a more complex (if optional)
// flow, e.g.:
//
// - Where it can be determined upfront that the form has no need to perform IO
// - Where the IO may have already been performed (e.g. offline, other potential
//   caching cases where appropriate)
export type InitializeForm = (
	input: FormResource,
	options?: InitializeFormOptions
) => Promise<RootNode>;
