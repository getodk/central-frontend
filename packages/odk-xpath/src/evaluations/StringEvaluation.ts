import type { LocationPathEvaluation } from './LocationPathEvaluation.ts';
import { ValueEvaluation } from './ValueEvaluation.ts';

export class StringEvaluation extends ValueEvaluation<'STRING'> {
	readonly type = 'STRING';
	readonly nodes = null;

	protected readonly booleanValue: boolean;
	protected readonly numberValue: number;
	protected readonly stringValue: string;

	constructor(
		readonly context: LocationPathEvaluation,
		readonly value: string,
		readonly isEmpty: boolean = value === ''
	) {
		super();

		this.booleanValue = !isEmpty;
		this.numberValue = isEmpty ? NaN : Number(value);
		this.stringValue = value;

		const numberFunction = context.functions.getDefaultImplementation('number');

		if (isEmpty) {
			this.numberValue = NaN;
		} else {
			this.numberValue = Number(value);

			if (numberFunction != null) {
				this.numberValue = numberFunction
					.call(context, [
						{
							evaluate: () => this,
						},
					])
					.toNumber();
			}
		}
	}
}
