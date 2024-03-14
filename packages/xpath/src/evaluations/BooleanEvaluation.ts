import type { LocationPathEvaluation } from './LocationPathEvaluation.ts';
import { ValueEvaluation } from './ValueEvaluation.ts';

export class BooleanEvaluation extends ValueEvaluation<'BOOLEAN'> {
	readonly type = 'BOOLEAN';
	readonly nodes = null;

	protected readonly booleanValue: boolean;
	protected readonly numberValue: number;
	protected readonly stringValue: string;

	constructor(
		readonly context: LocationPathEvaluation,
		readonly value: boolean
	) {
		super();

		this.booleanValue = value;
		this.numberValue = value ? 1 : 0;
		this.stringValue = String(value);
	}
}
