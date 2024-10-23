import type { Evaluation } from '../../evaluations/Evaluation.ts';
import { PrimitiveResult } from './PrimitiveResult.ts';
import type { XPathEvaluationResult } from './XPathEvaluationResult.ts';

export class NumberResult extends PrimitiveResult implements XPathEvaluationResult {
	protected readonly nodes = null;

	readonly resultType = PrimitiveResult.NUMBER_TYPE;
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
