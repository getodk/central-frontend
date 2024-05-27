import type { AnyNode } from '@getodk/xforms-engine';

/**
 * Wraps a node (as in `@getodk/xforms-engine` semantic terms) to provide
 * interface compatibility with JavaRosa's `TreeReference`, as minimally as
 * possible to satisfy ported test logic/assertions.
 */
export class TreeReference {
	constructor(readonly node: AnyNode) {}

	/**
	 * @todo Currently the engine doesn't provide a representation of secondary
	 * instances **at all**. This seems "correct" for the current engine/client
	 * responsibility boundaries, but that may change if/as we expand the
	 * client concept into other areas of functionality beyond the primary form-
	 * filling UI use cases.
	 */
	getInstanceName(): string | null {
		return null;
	}
}
