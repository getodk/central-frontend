import { InspectableComparisonError } from '@getodk/common/test/assertions/helpers.ts';
import type { SimpleAssertionResult } from '@getodk/common/test/assertions/vitest/shared-extension-types.ts';
import type { TriggerNode } from '@getodk/xforms-engine';
import type { ComparableAnswer } from './ComparableAnswer.ts';
import { ValueNodeAnswer } from './ValueNodeAnswer.ts';

class TriggerNodeAnswerComparisonError extends Error {
	constructor() {
		super('Trigger value should be compared with/asserted as a boolean');
	}
}

export class TriggerNodeAnswer extends ValueNodeAnswer<TriggerNode> {
	private readonly triggerValue: boolean;

	override get booleanValue(): boolean {
		return this.triggerValue;
	}

	constructor(node: TriggerNode) {
		super(node);

		this.triggerValue = node.currentState.value;
	}

	override equals(expected: ComparableAnswer): SimpleAssertionResult | null {
		const { booleanValue } = expected;

		if (booleanValue == null) {
			throw new TriggerNodeAnswerComparisonError();
		}

		const pass = this.booleanValue === booleanValue;

		return pass || new InspectableComparisonError(expected, this, 'equal');
	}

	get stringValue(): string {
		throw new TriggerNodeAnswerComparisonError();
	}
}
