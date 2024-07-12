/**
 * Specifies detection of Node runtime environment.
 */
// This is a heuristic which, unfortunately, may need to evolve as tooling
// packages are updated (hence it now being shared across packages). Details of
// its evolution will be noted as they're added or modified.
// prettier-ignore
export const IS_NODE_RUNTIME =
	// Previously we only checked that this global object is defined...
	typeof process === 'object' && process !== null &&

	// ... we have added this heuristic to adapt to a change in Vitest's browser
	// mode, which began poulating `process.env` (via Vite's `define` config) with
	// some conditions apparently used to mollify `testing-library`. It isn't
	// exactly clear why any `testing-library` packages are installed by Vitest
	// itself (though it appears there is some guidance to use it and/or its
	// framework-specific variants for certain browser testing scenarios since
	// @vitest/browser v2).
	typeof (process as Partial<NodeJS.Process>).versions?.node === 'string';
