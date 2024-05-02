import type { RootNode } from '@getodk/xforms-engine';
import { UnclearApplicabilityError } from '../../error/UnclearApplicabilityError.ts';

/**
 * @todo Hopefully we can keep this interface extremely minimal. It currently
 * exists only to allow tests calling into it to type check.
 */
export class JRFormDef {
	constructor(readonly instanceRoot: RootNode) {}

	getMainInstance(): RootNode {
		return this.instanceRoot;
	}

	/**
	 * Note: this appears to look up actions by their local tag name. For
	 * instance, the first such call in a ported test looks up `recordaudio`,
	 * which evidently corresponds to `odk:recordaudio` (which is also not
	 * mentioned in the
	 * {@link https://getodk.github.io/xforms-spec/#events | ODK XForms specification's Events section}).
	 *
	 * Also note: this method is hard-coded to throw. We should consider other
	 * approaches to assertions which currently call it.
	 */
	hasAction(_actionName: string): boolean {
		throw new UnclearApplicabilityError("JavaRosa's `FormDef.hasAction`");
	}
}
