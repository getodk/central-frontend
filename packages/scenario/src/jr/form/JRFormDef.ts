import type { RootNode } from '@getodk/xforms-engine';
import { expect } from 'vitest';
import { UnclearApplicabilityError } from '../../error/UnclearApplicabilityError.ts';
import type { Scenario } from '../Scenario.ts';
import type { JRTreeReference } from '../xpath/JRTreeReference.ts';
import type { JRFormIndex } from './JRFormIndex.ts';

/**
 * @todo Hopefully we can keep this interface extremely minimal. It currently
 * exists only to allow tests calling into it to type check.
 */
export class JRFormDef {
	constructor(readonly scenario: Scenario) {}

	getMainInstance(): RootNode {
		return this.scenario.instanceRoot;
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

	isRepeatRelevant(treeReference: JRTreeReference): boolean {
		const node = this.scenario.getInstanceNode(treeReference.xpathReference);

		expect(node.nodeType).toBe('repeat-instance');

		return node.currentState.relevant;
	}

	/**
	 * **PORTING NOTES**
	 *
	 * Stubbed to pass type checks of tests calling this method. As they're
	 * encountered, and as reasonably possible, an attempt will be made to produce
	 * alternate tests with the same semantics, using {@link Scenario} APIs.
	 *
	 * While this currently throws an {@link UnclearApplicabilityError}, that is
	 * only meant to signal the fact that we don't anticipate an equivalent to the
	 * `FormDef` interface (as distinct from existing interfaces provided by the
	 * client). This functionality is already supported, and to the extent
	 * possible alternate tests will demonstrate the appropriate usage (as
	 * mediated by the {@link Scenario} client.)
	 */
	deleteRepeat(_index: JRFormIndex): JRFormIndex {
		throw new UnclearApplicabilityError(
			'FormDef, as an interface to control instance state (`deleteRepeat`)'
		);
	}

	/**
	 * **PORTING NOTES**
	 *
	 * Stubbed to pass type checks of tests calling this method. As they're
	 * encountered, and as reasonably possible, an attempt will be made to produce
	 * alternate tests with the same semantics, using {@link Scenario} APIs.
	 *
	 * In the short term, we don't have an equivalent method. We also don't yet
	 * support features which would likely cause a hypothetical equivalent to
	 * return false.
	 *
	 * While this currently throws an {@link UnclearApplicabilityError}, that
	 * isn't to say the functionality itself is of unclear applicability. It seems
	 * quite likely we'll want a way to signal this exact semantic state when (for
	 * instance) we introduce support for `jr:count`. Throwing here is **only**
	 * meant to signal that we don't anticipate an equivalent to the `FormDef` API
	 * as it's used here/at call sites of this method.
	 */
	canCreateRepeat(_repeatRef: JRTreeReference, _repeatIndex: JRFormIndex): boolean {
		throw new UnclearApplicabilityError(
			'FormDef, as an interface to determine instance state (`canCreateRepeat`)'
		);
	}
}
