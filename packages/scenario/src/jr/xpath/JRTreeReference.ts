import type { CustomInspectable } from '@getodk/common/test/assertions/helpers.ts';
import type { JSONValue } from '@getodk/common/types/JSONValue.ts';

/**
 * @todo Hopefully we can keep this interface extremely minimal. It currently
 * exists only to allow tests calling into it to type check.
 */
export class JRTreeReference implements CustomInspectable {
	constructor(readonly xpathReference: string) {}

	inspectValue(): JSONValue {
		return this.xpathReference;
	}

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
