import type { AnyNode } from '@getodk/xforms-engine';
import { UnclearApplicabilityError } from '../../error/UnclearApplicabilityError.ts';
import type { Scenario } from '../Scenario.ts';
import type { JRFormDef } from '../form/JRFormDef.ts';
import type { JRFormIndex } from '../form/JRFormIndex.ts';

type AnyNodeCurrentState = AnyNode['currentState'];

/**
 * **PORTING NOTES**
 *
 * It appears that this is an API used in JavaRosa to access `<label>`/`<hint>`
 * values and/or structures. It seems likely that this will correspond, at least
 * conceptually, to our notion of a node's properties with `TextRange` values
 * (i.e. currently {@link AnyNodeCurrentState.label} and
 * {@link AnyNodeCurrentState.hint}).
 *
 * This is currently stubbed to fail on construction. To the extent it's
 * reasonable, ported tests which exercise it will be accompanied by an
 * alternate approach, potentially exercising proposed extensions to
 * {@link Scenario}.
 */
export class JRFormEntryCaption {
	constructor(_form: JRFormDef, _index: JRFormIndex) {
		throw new UnclearApplicabilityError("JavaRosa's `FormEntryCaption` API");
	}

	getQuestionText(): string {
		throw new UnclearApplicabilityError("JavaRosa's `FormEntryCaption` API");
	}
}
