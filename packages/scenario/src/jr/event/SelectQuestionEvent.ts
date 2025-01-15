import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import { xmlXPathWhitespaceSeparatedList } from '@getodk/common/lib/string/whitespace.ts';
import type {
	AnySelectNode,
	RootNode,
	SelectNode,
	SelectValues,
	ValueType,
} from '@getodk/xforms-engine';
import { assert } from 'vitest';
import { SelectNodeAnswer } from '../../answer/SelectNodeAnswer.ts';
import { UntypedAnswer } from '../../answer/UntypedAnswer.ts';
import type { ValueNodeAnswer } from '../../answer/ValueNodeAnswer.ts';
import { SelectChoice } from '../select/SelectChoice.ts';
import { QuestionEvent } from './QuestionEvent.ts';

interface StringValueSelectWriteMethods {
	selectValue(value: string): RootNode;
	selectValues(values: readonly string[]): RootNode;
}

type StringValueSelectNode = Extract<AnySelectNode, StringValueSelectWriteMethods>;

export class SelectQuestionEvent extends QuestionEvent<'select'> {
	getAnswer(): SelectNodeAnswer {
		return new SelectNodeAnswer(this.node);
	}

	getChoice(choiceIndex: number): SelectChoice<this['node']['valueType']> {
		const items = this.node.currentState.valueOptions;
		const item = items[choiceIndex];

		if (item == null) {
			throw new Error(`No choice at index ${choiceIndex}`);
		}

		return new SelectChoice(item);
	}

	private getOptionValues<V extends ValueType>(
		node: SelectNode<V>,
		stringValues: readonly string[]
	): SelectValues<V> {
		const optionsByStringValue = new Map(
			node.currentState.valueOptions.map((item) => {
				return [item.asString, item];
			})
		);

		return stringValues.map((stringValue) => {
			const option = optionsByStringValue.get(stringValue);

			assert(option);

			return option.value;
		});
	}

	private answerTypedQuestion<V extends ValueType>(
		node: SelectNode<V>,
		stringValues: readonly string[]
	): SelectNodeAnswer<V> {
		const values = this.getOptionValues(node, stringValues);

		node.selectValues(values);

		return new SelectNodeAnswer(node);
	}

	/**
	 * @todo This is yet another case where it would make more sense to split up
	 * the {@link SelectNode} by control type.
	 */
	answerQuestion(answerValue: unknown): ValueNodeAnswer {
		const node: AnySelectNode = this.node;

		if (answerValue == null) {
			node.selectValue(null);

			return new SelectNodeAnswer(node);
		}

		const { stringValue } = new UntypedAnswer(answerValue);
		const { selectType } = this.node;

		let stringValues: readonly string[];

		switch (selectType) {
			case 'select':
				stringValues = xmlXPathWhitespaceSeparatedList(stringValue, {
					ignoreEmpty: true,
				});

				break;

			case 'select1':
				if (stringValue === '') {
					stringValues = [];
				} else {
					stringValues = [stringValue];
				}

				break;

			default:
				throw new UnreachableError(selectType);
		}

		switch (node.valueType) {
			case 'string':
			case 'boolean':
			case 'date':
			case 'time':
			case 'dateTime':
			case 'geopoint':
			case 'geotrace':
			case 'geoshape':
			case 'binary':
			case 'barcode':
			case 'intent':
				// This will continue to pass for each of the above value types while
				// the engine's implementation falls back to `string` for each
				// respective type. It will produce a type error if/when each value type
				// is implemented with a different runtime representation.
				node satisfies StringValueSelectNode;

				this.node.selectValues(stringValues);

				return new SelectNodeAnswer(node);
		}

		return this.answerTypedQuestion(node, stringValues);
	}
}
