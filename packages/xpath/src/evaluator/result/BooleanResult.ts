import type { Evaluation } from '../../evaluations/Evaluation.ts';
import { PrimitiveResult } from './PrimitiveResult.ts';
import type { XPathEvaluationResult } from './XPathEvaluationResult.ts';

export class BooleanResult extends PrimitiveResult implements XPathEvaluationResult {
	protected readonly nodes = null;

	readonly resultType = PrimitiveResult.BOOLEAN_TYPE;
	readonly booleanValue: boolean;
	readonly numberValue: number;
	readonly stringValue: string;

	constructor(evaluation: Evaluation) {
		super();

		this.booleanValue = evaluation.toBoolean();
		this.numberValue = evaluation.toNumber();
		this.stringValue = evaluation.toString();
	}
}
