import type { AnyRangeNode, DecimalRangeNode, IntRangeNode } from '@getodk/xforms-engine';
import { RangeNodeAnswer } from '../../answer/RangeNodeAnswer.ts';
import { UntypedAnswer } from '../../answer/UntypedAnswer.ts';
import type { ValueNodeAnswer } from '../../answer/ValueNodeAnswer.ts';
import { QuestionEvent } from './QuestionEvent.ts';

export class RangeQuestionEvent extends QuestionEvent<'range'> {
	getAnswer(): RangeNodeAnswer {
		return new RangeNodeAnswer(this.node);
	}

	private answerDefault(node: AnyRangeNode, answerValue: unknown): ValueNodeAnswer {
		const { stringValue } = new UntypedAnswer(answerValue);

		node.setValue(stringValue);

		return new RangeNodeAnswer(node);
	}

	private answerNumericQuestionNode(
		node: DecimalRangeNode | IntRangeNode,
		answerValue: unknown
	): ValueNodeAnswer {
		if (answerValue === null) {
			node.setValue(answerValue);

			return new RangeNodeAnswer(node);
		}

		switch (typeof answerValue) {
			case 'bigint':
			case 'number':
			case 'string':
				node.setValue(answerValue);

				return new RangeNodeAnswer(node);

			default:
				return this.answerDefault(node, answerValue);
		}
	}

	answerQuestion(answerValue: unknown): ValueNodeAnswer {
		const { node } = this;

		switch (node.valueType) {
			case 'int':
			case 'decimal':
				return this.answerNumericQuestionNode(node, answerValue);

			default:
				return this.answerDefault(node, answerValue);
		}
	}
}
