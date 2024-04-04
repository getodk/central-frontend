import { UpsertableMap } from '@odk-web-forms/common/lib/collections/UpsertableMap.ts';
import { UnreachableError } from '@odk-web-forms/common/lib/error/UnreachableError.ts';
import type { XFormsElement } from '@odk-web-forms/common/test/fixtures/xform-dsl/XFormsElement.ts';
import type { CollectionValues } from '@odk-web-forms/common/types/collections/CollectionValues.ts';
import type {
	RepeatInstanceState,
	RepeatSequenceState,
	SubtreeState,
} from '@odk-web-forms/xforms-engine';
import { EntryState, ValueNodeState, XFormDefinition } from '@odk-web-forms/xforms-engine';
import type {
	AnyBodyElementDefinition,
	NonRepeatGroupElementDefinition,
} from '@odk-web-forms/xforms-engine/body/BodyDefinition.ts';
import type { AnyControlDefinition } from '@odk-web-forms/xforms-engine/body/control/ControlDefinition.ts';
import type { AnyNodeState } from '@odk-web-forms/xforms-engine/state/NodeState.ts';
import { createMemo, createSignal, type Accessor, type Signal } from 'solid-js';
import { afterEach, expect } from 'vitest';
import { castToString } from './cast.ts';

interface BodyElementSpecifier<
	Element extends AnyBodyElementDefinition = AnyBodyElementDefinition,
> {
	readonly bodyElement: Element;
}

interface GroupQuestionState
	extends SubtreeState,
		BodyElementSpecifier<NonRepeatGroupElementDefinition> {}

interface ControlQuestionState extends ValueNodeState, BodyElementSpecifier<AnyControlDefinition> {}

/**
 * Based on the static members on JavaRosa's `FormEntryController` (there
 * prefixed `EVENT_*`).
 */
// prettier-ignore
type QuestionPositon =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| 'BEGINNING_OF_FORM'
	| 'REPEAT'
	| 'REPEAT_JUNCTURE'
	| 'PROMPT_NEW_REPEAT'
	| 'GROUP'
	| 'QUESTION'
	| 'END_OF_FORM'

// prettier-ignore
type QuestionPositionState<Position extends QuestionPositon> =
	Position extends 'BEGINNING_OF_FORM'
		? null
	: Position extends 'QUESTION'
		? ControlQuestionState
	: Position extends 'GROUP'
		? GroupQuestionState
	: Position extends 'REPEAT'
		? RepeatInstanceState
	: Position extends 'REPEAT_JUNCTURE'
		? never // per @lognaturel, this can be ignored
	: Position extends 'PROMPT_NEW_REPEAT'
		? RepeatSequenceState
	: Position extends 'END_OF_FORM'
		? null
		: never;

abstract class Question<Position extends QuestionPositon> {
	abstract readonly position: Position;
	abstract readonly state: QuestionPositionState<Position>;
}

let beginningOfForm!: BeginningOfForm;

class BeginningOfForm extends Question<'BEGINNING_OF_FORM'> {
	static createSingleton(): BeginningOfForm {
		if (beginningOfForm == null) {
			beginningOfForm = new this();
		}

		return beginningOfForm;
	}

	override readonly position = 'BEGINNING_OF_FORM';
	override readonly state = null;

	private constructor() {
		super();
	}
}

let endOfForm!: EndOfForm;

class EndOfForm extends Question<'END_OF_FORM'> {
	static createSingleton(): EndOfForm {
		if (endOfForm == null) {
			endOfForm = new this();
		}

		return endOfForm;
	}

	override readonly position = 'END_OF_FORM';
	override readonly state = null;

	private constructor() {
		super();
	}
}

type TerminalPosition = 'BEGINNING_OF_FORM' | 'END_OF_FORM';

type AnyStatefulQuestionPosition = Question<Exclude<QuestionPositon, TerminalPosition>>;

const isControlQuestionState = (state: AnyNodeState): state is ControlQuestionState => {
	return state.type === 'value-node' && state.definition.bodyElement != null;
};

class QuestionSingletonMap extends UpsertableMap<AnyQuestionState, AnyStatefulQuestionPosition> {
	createSingleton(
		position: 'QUESTION',
		state: ControlQuestionState,
		produce: () => ControlQuestion
	): ControlQuestion;
	createSingleton(
		position: 'GROUP',
		state: GroupQuestionState,
		produce: () => GroupQuestion
	): GroupQuestion;
	createSingleton(
		position: 'REPEAT',
		state: RepeatInstanceState,
		produce: () => RepeatInstanceQuestion
	): RepeatInstanceQuestion;
	createSingleton(
		position: 'PROMPT_NEW_REPEAT',
		state: RepeatSequenceState,
		produce: () => PromptNewRepeatQuestion
	): PromptNewRepeatQuestion;

	createSingleton(
		_position: 'GROUP' | 'PROMPT_NEW_REPEAT' | 'QUESTION' | 'REPEAT',
		state: AnyQuestionState,
		produce: () => StatefulQuestion
	) {
		return this.upsert(state, produce);
	}
}

const questionSingletons = new QuestionSingletonMap();

class ControlQuestion extends Question<'QUESTION'> {
	static createSingleton(state: ControlQuestionState): ControlQuestion {
		return questionSingletons.createSingleton('QUESTION', state, () => new this(state));
	}

	override readonly position = 'QUESTION';

	private constructor(override readonly state: ControlQuestionState) {
		super();
	}
}

const isGroupQuestionState = (state: AnyNodeState): state is GroupQuestionState => {
	return state.type === 'subtree' && state.definition.bodyElement != null;
};

class GroupQuestion extends Question<'GROUP'> {
	static createSingleton(state: GroupQuestionState): GroupQuestion {
		return questionSingletons.createSingleton('GROUP', state, () => new this(state));
	}

	override readonly position = 'GROUP';

	private constructor(override readonly state: GroupQuestionState) {
		super();
	}
}

const isRepeatInstanceState = (state: AnyNodeState): state is RepeatInstanceState => {
	return state.type === 'repeat-instance';
};

class RepeatInstanceQuestion extends Question<'REPEAT'> {
	static createSingleton(state: RepeatInstanceState): RepeatInstanceQuestion {
		return questionSingletons.createSingleton('REPEAT', state, () => new this(state));
	}

	override readonly position = 'REPEAT';

	private constructor(override readonly state: RepeatInstanceState) {
		super();
	}
}

const isRepeatSequenceState = (state: AnyNodeState): state is RepeatSequenceState => {
	return state.type === 'repeat-sequence';
};

class PromptNewRepeatQuestion extends Question<'PROMPT_NEW_REPEAT'> {
	static createSingleton(state: RepeatSequenceState): PromptNewRepeatQuestion {
		return questionSingletons.createSingleton('PROMPT_NEW_REPEAT', state, () => {
			return new this(state);
		});
	}

	override readonly position = 'PROMPT_NEW_REPEAT';

	private constructor(override readonly state: RepeatSequenceState) {
		super();
	}
}

type AnyQuestionState = Exclude<QuestionPositionState<QuestionPositon>, null>;

const getQuestionStates = (state: AnyNodeState): readonly AnyQuestionState[] => {
	if (state.type === 'root') {
		return state.children.flatMap(getQuestionStates);
	}

	if (isRepeatSequenceState(state)) {
		return [...state.getInstances().flatMap(getQuestionStates), state];
	}

	if (isRepeatInstanceState(state) || isGroupQuestionState(state)) {
		return [state, ...state.children.flatMap(getQuestionStates)];
	}

	if (state.type === 'subtree') {
		return state.children.flatMap(getQuestionStates);
	}

	if (isControlQuestionState(state)) {
		return [state];
	}

	return [];
};

type StatefulQuestion =
	| ControlQuestion
	| GroupQuestion
	| PromptNewRepeatQuestion
	| RepeatInstanceQuestion;

const getQuestionState = (state: AnyQuestionState): StatefulQuestion => {
	switch (state.type) {
		case 'repeat-instance':
			return RepeatInstanceQuestion.createSingleton(state);

		case 'repeat-sequence':
			return PromptNewRepeatQuestion.createSingleton(state);

		case 'subtree':
			return GroupQuestion.createSingleton(state);

		case 'value-node':
			return ControlQuestion.createSingleton(state);

		default:
			throw new UnreachableError(state);
	}
};

const getStatefulQuestions = (state: AnyNodeState): readonly StatefulQuestion[] => {
	const questionStates = getQuestionStates(state);

	return questionStates.map(getQuestionState);
};

type Questions = readonly [BeginningOfForm, ...StatefulQuestion[], EndOfForm];

type SelectedQuestion = CollectionValues<Questions>;

const collectQuestions = (state: AnyNodeState): Questions => {
	return [
		BeginningOfForm.createSingleton(),
		...getStatefulQuestions(state),
		EndOfForm.createSingleton(),
	];
};

interface ScenarioConstructorOptions {
	readonly formName: string;
	readonly form: XFormsElement;
}

export class Scenario {
	static init(formName: string, form: XFormsElement) {
		return new this({
			formName,
			form,
		});
	}

	readonly formName: string;
	readonly form: XFormDefinition;
	readonly entry: EntryState;

	private readonly questions: Accessor<Questions>;
	private readonly selectedQuestionIndex: Signal<number>;
	private readonly selectedQuestion: Accessor<SelectedQuestion>;

	private constructor(options: ScenarioConstructorOptions) {
		this.formName = options.formName;

		const form = new XFormDefinition(options.form.asXml());
		const entry = new EntryState(form);

		this.form = form;
		this.entry = entry;

		this.questions = createMemo(() => {
			return collectQuestions(entry);
		});

		const selectedQuestionIndex = createSignal(0);

		this.selectedQuestionIndex = selectedQuestionIndex;
		this.selectedQuestion = createMemo(() => {
			const [selectedQuestion] = selectedQuestionIndex;
			const index = selectedQuestion();
			const question = this.questions()[index];

			if (question != null) {
				return question;
			}

			throw new Error(`No question at index: ${index}`);
		});

		afterEach(() => {
			questionSingletons.clear();
		});
	}

	private assertQuestionSelected(question: SelectedQuestion): asserts question is StatefulQuestion {
		expect(question).not.toBe(beginningOfForm);
		expect(question).not.toBe(endOfForm);
	}

	private assertNodeset(
		question: SelectedQuestion,
		nodeset: string
	): asserts question is StatefulQuestion {
		this.assertQuestionSelected(question);
		expect(question.state.nodeset).toBe(nodeset);
	}

	private assertReference(
		question: SelectedQuestion,
		reference: string
	): asserts question is StatefulQuestion {
		this.assertQuestionSelected(question);
		expect(question.state.reference).toBe(reference);
	}

	private setQuestionIndex(
		callback: (current: number) => number,
		expectReference: string
	): SelectedQuestion {
		const [, setIndex] = this.selectedQuestionIndex;

		setIndex(callback);

		const question = this.selectedQuestion();

		if (expectReference != null) {
			this.assertReference(question, expectReference);
		}

		return question;
	}

	next(expectReference: string): SelectedQuestion {
		const increment = (current: number): number => current + 1;

		return this.setQuestionIndex(increment, expectReference);
	}

	answer(value: unknown): unknown {
		const question = this.selectedQuestion();

		if (question instanceof BeginningOfForm) {
			throw new Error('Cannot answer question, beginning of form is selected');
		}

		if (question instanceof EndOfForm) {
			throw new Error('Cannot answer question, end of form is selected');
		}

		if (!(question instanceof ControlQuestion)) {
			throw new Error(`Cannot answer question of type ${question.state.type}`);
		}

		// TODO: in the future this should be... not in the test interface. I was
		// tempted to handle it in the state interface itself, but I'm hesitant to
		// establish any precedent for casting before digging into handling multiple
		// data types more broadly.
		const stringValue = castToString(value);

		question.state.setValue(stringValue);

		return;
	}

	answerOf(reference: string): string {
		const question = this.entry.getState(reference);

		if (!(question instanceof ValueNodeState)) {
			throw new Error(`State for reference ${reference} is not a question`);
		}

		return question.getValue();
	}

	private getClosestRepeatSequence(
		fromState: AnyNodeState,
		currentState: AnyNodeState = fromState
	): RepeatSequenceState {
		switch (currentState.type) {
			case 'root':
				throw new Error(
					`Failed to find closest repeat sequence to state with reference: ${fromState.reference}`
				);

			case 'repeat-sequence':
				return currentState;

			case 'repeat-instance':
				return currentState.parent;

			case 'subtree':
			case 'value-node':
				return this.getClosestRepeatSequence(currentState.parent);

			default:
				throw new UnreachableError(currentState);
		}
	}

	createNewRepeat(repeatNodeset: string): unknown {
		const question = this.selectedQuestion();

		this.assertNodeset(question, repeatNodeset);

		const repeatSequence = this.getClosestRepeatSequence(question.state);

		const instance = repeatSequence.createInstance();
		const instanceQuestion = RepeatInstanceQuestion.createSingleton(instance);
		const index = this.questions().indexOf(instanceQuestion);

		this.setQuestionIndex(() => index, instance.reference);

		return;
	}
}
