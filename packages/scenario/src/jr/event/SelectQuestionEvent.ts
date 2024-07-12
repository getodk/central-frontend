import { xmlXPathWhitespaceSeparatedList } from '@getodk/common/lib/string/whitespace.ts';
import type { SelectNode } from '@getodk/xforms-engine';
import { SelectNodeAnswer } from '../../answer/SelectNodeAnswer.ts';
import { UntypedAnswer } from '../../answer/UntypedAnswer.ts';
import type { ValueNodeAnswer } from '../../answer/ValueNodeAnswer.ts';
import type { Scenario } from '../Scenario.ts';
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
	 * @todo Per @sadiqkhoja, this is another good example of where at least one
	 * kind of "select multiple" API would be much more sensible.
	 *
	 * @todo It's also pretty likely we might want an escape hatch for setting
	 * encoded values directly from the client. But proceed with caution: if we
	 * did this, we'd need to apply all of the same parsing, sanitization,
	 * validation, etc logic (likely per node and data type) at that client API
	 * boundary as we do internally.
	 *
	 * @todo This is also yet another case where it would make more sense to split
	 * up the {@link SelectNode} type.
	 *
	 * @todo pending split up of {@link SelectNode} type: regardless of other
	 * improvements to setter APIs, only `<select>` should have this whitespace
	 * behavior! For now it's consistent with the internals (which we shouldn't
	 * need to know about here because {@link Scenario} is a client)
	 */
	answerQuestion(answerValue: unknown): ValueNodeAnswer {
		const { node } = this;
		const { stringValue } = new UntypedAnswer(answerValue);

		const selectedValues = xmlXPathWhitespaceSeparatedList(stringValue, {
			ignoreEmpty: true,
		});
		const selectedItems = node.currentState.valueOptions.filter((item) => {
			return selectedValues.includes(item.value);
		});

		node.currentState.value.forEach((currentItem) => {
			if (!selectedValues.includes(currentItem.value)) {
				node.deselect(currentItem);
			}
		});

		selectedItems.forEach((selectedItem) => {
			node.select(selectedItem);
		});

		return new SelectNodeAnswer(node);
	}
}
