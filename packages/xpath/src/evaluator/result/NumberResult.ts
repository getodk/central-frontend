import type { XPathResult } from '../../shared/index.ts';
import type { Evaluation } from '../../evaluations/Evaluation.ts';
import { PrimitiveResult } from './PrimitiveResult.ts';

export class NumberResult extends PrimitiveResult implements XPathResult {
	readonly isIntermediateResult = false;
	protected readonly type = PrimitiveResult.NUMBER_TYPE;
	protected readonly nodes = null;

	readonly booleanValue: boolean;
	readonly numberValue: number;
	readonly stringValue: string;

	constructor(evaluation: Evaluation) {
		super();

		this.numberValue = evaluation.toNumber();
		this.booleanValue = evaluation.toBoolean();
		this.stringValue = evaluation.toString();
	}
}
