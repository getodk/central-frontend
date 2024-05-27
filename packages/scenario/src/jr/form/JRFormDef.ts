import type { RootNode } from '@getodk/xforms-engine';

/**
 * @todo Hopefully we can keep this interface extremely minimal. It currently
 * exists only to allow tests calling into it to type check.
 */
export class JRFormDef {
	constructor(readonly instanceRoot: RootNode) {}

	getMainInstance(): RootNode {
		return this.instanceRoot;
	}
}
