import type { XPathResult } from '../../shared/index.ts';
import type { Evaluation } from '../../evaluations/Evaluation.ts';
import { PrimitiveResult } from './PrimitiveResult.ts';

export class StringResult extends PrimitiveResult implements XPathResult {
	readonly isIntermediateResult = false;
	protected readonly type = PrimitiveResult.STRING_TYPE;
	protected readonly nodes = null;

	readonly booleanValue: boolean;
	readonly numberValue: number;
	readonly stringValue: string;

	constructor(evaluation: Evaluation) {
		super();

		this.stringValue = evaluation.toString();
		this.booleanValue = evaluation.toBoolean();
		this.numberValue = evaluation.toNumber();
	}
}
