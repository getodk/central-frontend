import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import { xmlXPathWhitespaceSeparatedList } from '@getodk/common/lib/string/whitespace.ts';
import type { SelectNode } from '@getodk/xforms-engine';
import { SelectNodeAnswer } from '../../answer/SelectNodeAnswer.ts';
import { UntypedAnswer } from '../../answer/UntypedAnswer.ts';
import type { ValueNodeAnswer } from '../../answer/ValueNodeAnswer.ts';
import { SelectChoice } from '../select/SelectChoice.ts';
import { QuestionEvent } from './QuestionEvent.ts';

export class SelectQuestionEvent extends QuestionEvent<'select'> {
	getAnswer(): SelectNodeAnswer {
		return new SelectNodeAnswer(this.node);
	}

	getChoice(choiceIndex: number): SelectChoice {
		const items = this.node.currentState.valueOptions;
		const item = items[choiceIndex];

		if (item == null) {
			throw new Error(`No choice at index ${choiceIndex}`);
		}

		return new SelectChoice(item);
	}

	/**
	 * @todo This is yet another case where it would make more sense to split up
	 * the {@link SelectNode} by control type.
	 */
	answerQuestion(answerValue: unknown): ValueNodeAnswer {
		const { node } = this;

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

		this.node.selectValues(stringValues);

		return new SelectNodeAnswer(node);
	}
}
