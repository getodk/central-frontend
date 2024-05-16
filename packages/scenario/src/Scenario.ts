import { UpsertableMap } from '@getodk/common/lib/collections/UpsertableMap.ts';
import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import { xmlXPathWhitespaceSeparatedList } from '@getodk/common/lib/string/whitespace';
import type { XFormsElement } from '@getodk/common/test/fixtures/xform-dsl/XFormsElement.ts';
import type { CollectionValues } from '@getodk/common/types/collections/CollectionValues.ts';
import type {
	AnyNode,
	GroupNode,
	RepeatInstanceNode,
	RepeatRangeNode,
	RootNode,
	SelectItem,
	SelectNode,
	StringDefinition,
	StringNode,
} from '@getodk/xforms-engine';
import { initializeForm } from '@getodk/xforms-engine';
import type { Accessor, Signal } from 'solid-js';
import {
	batch,
	createMemo,
	createRoot,
	createSignal,
	getOwner,
	runWithOwner,
	untrack,
} from 'solid-js';
import { afterEach, expect } from 'vitest';
import { castToString } from './cast.ts';

// prettier-ignore
type AnyValueNode =
	| SelectNode
	| StringNode;

const isValueNode = (node: AnyNode): node is AnyValueNode => {
	const { definition } = node;

	return definition.type === 'value-node';
};

// TODO: this should also likely have an export from `StringNode`
type StringInputBodyElement = Exclude<StringDefinition['bodyElement'], null>;

// prettier-ignore
type StringInputDefinition =
	& StringDefinition
	& { readonly bodyElement: StringInputBodyElement }

// prettier-ignore
type StringInputQuestion =
	& StringNode
	& { readonly definition: StringInputDefinition };

const isStringInputQuestion = (node: AnyNode): node is StringInputQuestion => {
	return node.definition.bodyElement != null;
};

// prettier-ignore
type ControlQuestionNode =
	| SelectNode
	| StringInputQuestion;

const isControlQuestionNode = (node: AnyNode): node is ControlQuestionNode => {
	return node.nodeType === 'select' || isStringInputQuestion(node);
};

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
		? SelectNode | StringInputQuestion
	: Position extends 'GROUP'
		? GroupNode
	: Position extends 'REPEAT'
		? RepeatInstanceNode
	: Position extends 'REPEAT_JUNCTURE'
		? never // per @lognaturel, this can be ignored
	: Position extends 'PROMPT_NEW_REPEAT'
		? RepeatRangeNode
	: Position extends 'END_OF_FORM'
		? null
		: never;

abstract class Question<Position extends QuestionPositon> {
	abstract readonly position: Position;
	abstract readonly node: QuestionPositionState<Position>;
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
	override readonly node = null;

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
	override readonly node = null;

	private constructor() {
		super();
	}
}

type TerminalPosition = 'BEGINNING_OF_FORM' | 'END_OF_FORM';

type AnyInstanceQuestionPosition = Question<Exclude<QuestionPositon, TerminalPosition>>;

class QuestionSingletonMap extends UpsertableMap<string, AnyInstanceQuestionPosition> {
	createSingleton(
		position: 'QUESTION',
		node: ControlQuestionNode,
		produce: () => ControlQuestion
	): ControlQuestion;
	createSingleton(position: 'GROUP', node: GroupNode, produce: () => GroupQuestion): GroupQuestion;
	createSingleton(
		position: 'REPEAT',
		node: RepeatInstanceNode,
		produce: () => RepeatInstanceQuestion
	): RepeatInstanceQuestion;
	createSingleton(
		position: 'PROMPT_NEW_REPEAT',
		node: RepeatRangeNode,
		produce: () => PromptNewRepeatQuestion
	): PromptNewRepeatQuestion;

	createSingleton(
		_position: 'GROUP' | 'PROMPT_NEW_REPEAT' | 'QUESTION' | 'REPEAT',
		node: AnyQuestionNode,
		produce: () => InstanceQuestion
	) {
		return this.upsert(node.nodeId, produce);
	}
}

const questionSingletons = new QuestionSingletonMap();

class ControlQuestion extends Question<'QUESTION'> {
	static createSingleton(node: ControlQuestionNode): ControlQuestion {
		return questionSingletons.createSingleton('QUESTION', node, () => new this(node));
	}

	override readonly position = 'QUESTION';

	private constructor(override readonly node: ControlQuestionNode) {
		super();
	}

	getValue(options?: { untrack: true }): string {
		if (options?.untrack) {
			return untrack(() => {
				return this.getValue();
			});
		}

		const { node } = this;

		if (node.nodeType === 'select') {
			return node.currentState.value.map((item) => item.value).join(' ');
		}

		return node.currentState.value;
	}

	setValue(value: string): string {
		const { node } = this;

		// TODO: most clients probably shouldn't be doing any of this, but **this
		// client** has to if we don't expose it in the interface...
		if (node.nodeType === 'select') {
			const values = xmlXPathWhitespaceSeparatedList(value, {
				ignoreEmpty: true,
			});

			if (values.length === 0) {
				const currentValueItems = untrack(() => node.currentState.value);

				currentValueItems.forEach((item) => {
					node.deselect(item);
				});

				return '';
			}

			const itemOptionsByValue = untrack(() => {
				return node.currentState.valueOptions.reduce((acc, item) => {
					acc.set(item.value, item);

					return acc;
				}, new Map<string, SelectItem>());
			});

			const items = values.map((itemValue) => {
				const item = itemOptionsByValue.get(itemValue);

				if (item == null) {
					throw new Error(`No select item for value: ${value}`);
				}

				return item;
			});

			batch(() => {
				items.forEach((item) => {
					node.select(item);
				});
			});

			return this.getValue({ untrack: true });
		}

		node.setValue(value);

		return this.getValue({ untrack: true });
	}
}

class GroupQuestion extends Question<'GROUP'> {
	static createSingleton(node: GroupNode): GroupQuestion {
		return questionSingletons.createSingleton('GROUP', node, () => new this(node));
	}

	override readonly position = 'GROUP';

	private constructor(override readonly node: GroupNode) {
		super();
	}
}

class RepeatInstanceQuestion extends Question<'REPEAT'> {
	static createSingleton(node: RepeatInstanceNode): RepeatInstanceQuestion {
		return questionSingletons.createSingleton('REPEAT', node, () => new this(node));
	}

	override readonly position = 'REPEAT';

	private constructor(override readonly node: RepeatInstanceNode) {
		super();
	}
}

class PromptNewRepeatQuestion extends Question<'PROMPT_NEW_REPEAT'> {
	static createSingleton(node: RepeatRangeNode): PromptNewRepeatQuestion {
		return questionSingletons.createSingleton('PROMPT_NEW_REPEAT', node, () => {
			return new this(node);
		});
	}

	override readonly position = 'PROMPT_NEW_REPEAT';

	private constructor(override readonly node: RepeatRangeNode) {
		super();
	}
}

type AnyQuestionNode = Exclude<QuestionPositionState<QuestionPositon>, null>;

const getQuestionNodes = (node: AnyNode): readonly AnyQuestionNode[] => {
	switch (node.nodeType) {
		case 'root':
			return node.currentState.children.flatMap(getQuestionNodes);

		case 'repeat-range':
			return [...node.currentState.children.flatMap(getQuestionNodes), node];

		case 'repeat-instance':
		case 'group':
			return [node, ...node.currentState.children.flatMap(getQuestionNodes)];

		case 'subtree':
			return node.currentState.children.flatMap(getQuestionNodes);

		case 'select':
			return [node];

		case 'string':
			if (isStringInputQuestion(node)) {
				return [node];
			}

			return [];

		default:
			throw new UnreachableError(node);
	}
};

type InstanceQuestion =
	| ControlQuestion
	| GroupQuestion
	| PromptNewRepeatQuestion
	| RepeatInstanceQuestion;

const getQuestionNode = (node: AnyQuestionNode): InstanceQuestion => {
	switch (node.nodeType) {
		case 'repeat-instance':
			return RepeatInstanceQuestion.createSingleton(node);

		case 'repeat-range':
			return PromptNewRepeatQuestion.createSingleton(node);

		case 'group':
			return GroupQuestion.createSingleton(node);

		case 'select':
		case 'string':
			return ControlQuestion.createSingleton(node);

		default:
			throw new UnreachableError(node);
	}
};

const getInstanceQuestions = (node: AnyNode): readonly InstanceQuestion[] => {
	const questionNodes = getQuestionNodes(node);

	return questionNodes.map(getQuestionNode);
};

type Questions = readonly [BeginningOfForm, ...InstanceQuestion[], EndOfForm];

type SelectedQuestion = CollectionValues<Questions>;

const collectQuestions = (node: AnyNode): Questions => {
	return [
		BeginningOfForm.createSingleton(),
		...getInstanceQuestions(node),
		EndOfForm.createSingleton(),
	];
};

interface ScenarioConstructorOptions {
	readonly formName: string;
	readonly instanceRoot: RootNode;
}

/**
 * Satisfies the xforms-engine client `stateFactory` option. Currently this is
 * intentionally **not** reactive, as the current scenario tests (as
 * ported/derived from JavaRosa's test suite) do not explicitly exercise any
 * reactive aspects of the client interface.
 *
 * @todo It **is possible** to use Solid's `createMutable`, which would enable
 * expansion of the JavaRosa test suite to _also_ test reactivity. In local
 * testing during the migration to the new client interface, no additional
 * changes were necessary to make that change. For now this non-reactive factory
 * is supplied as a validation that reactivity is in fact optional (despite the
 * fact that we're kind of observing the internal reactivity with a couple of
 * memos below).
 */
const nonReactiveIdentityStateFactory = <T extends object>(value: T): T => value;

/**
 * @todo Currently we stub resource fetching. We can address this as needed
 * while we port existing tests and/or add new ones which require it.
 */
const fetchResourceStub: typeof fetch = () => {
	throw new Error('TODO: resource fetching not implemented');
};

export class Scenario {
	static async init(formName: string, form: XFormsElement): Promise<Scenario> {
		return createRoot(async () => {
			const owner = getOwner()!;

			const instanceRoot = await initializeForm(form.asXml(), {
				config: {
					fetchResource: fetchResourceStub,
					stateFactory: nonReactiveIdentityStateFactory,
				},
			});

			return runWithOwner(owner, () => {
				return new this({
					formName,
					instanceRoot,
				});
			})!;
		});
	}

	readonly formName: string;
	readonly instanceRoot: RootNode;

	private readonly questions: Accessor<Questions>;
	private readonly selectedQuestionIndex: Signal<number>;
	private readonly selectedQuestion: Accessor<SelectedQuestion>;

	private constructor(options: ScenarioConstructorOptions) {
		const { formName, instanceRoot } = options;

		this.formName = formName;
		this.instanceRoot = instanceRoot;

		const selectedQuestionIndex = createSignal(0);

		this.selectedQuestionIndex = selectedQuestionIndex;

		this.questions = createMemo(() => {
			return collectQuestions(instanceRoot);
		});

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

	private assertQuestionSelected(question: SelectedQuestion): asserts question is InstanceQuestion {
		expect(question).not.toBe(beginningOfForm);
		expect(question).not.toBe(endOfForm);
	}

	private assertNodeset(
		question: SelectedQuestion,
		nodeset: string
	): asserts question is InstanceQuestion {
		this.assertQuestionSelected(question);
		expect(question.node.definition.nodeset).toBe(nodeset);
	}

	private assertReference(
		question: SelectedQuestion,
		reference: string
	): asserts question is InstanceQuestion {
		this.assertQuestionSelected(question);
		expect(question.node.currentState.reference).toBe(reference);
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
			throw new Error(`Cannot answer question of type ${question.node.definition.type}`);
		}

		// TODO: in the future this should be... not in the test interface. I was
		// (previously) tempted to handle it in the engine interface itself, but I'm
		// hesitant to establish any precedent for casting before digging into
		// handling multiple data types more broadly.
		const stringValue = castToString(value);

		question.setValue(stringValue);

		return;
	}

	private getNodeForReference<QuestionNode extends AnyNode = AnyNode>(
		reference: string,
		currentNode: AnyNode = this.instanceRoot
	): QuestionNode | null {
		if (currentNode.currentState.reference === reference) {
			return currentNode as QuestionNode;
		}

		const { children } = currentNode.currentState;

		if (children == null) {
			return null;
		}

		for (const child of children) {
			const question = this.getNodeForReference<QuestionNode>(reference, child);

			if (question != null) {
				return question;
			}
		}

		return null;
	}

	answerOf(reference: string): string {
		const node = this.getNodeForReference(reference);

		if (node == null || !isValueNode(node)) {
			throw new Error(`Node for reference ${reference} is not a question`);
		}

		// If node has a control, for now we defer to the `ControlQuestion` wrapper
		// to produce a consistent string value for test assertions.
		if (isControlQuestionNode(node)) {
			const question = ControlQuestion.createSingleton(node);

			return question.getValue();
		}

		// Currently a node at this point will be a model-only `StringNode`. This
		// will likely change as we introduce other data types, as those types may
		// also be assigned to model-only nodes.
		return node.currentState.value;
	}

	private getClosestRepeatRange(
		fromNode: AnyNode,
		currentNode: AnyNode = fromNode
	): RepeatRangeNode {
		switch (currentNode.nodeType) {
			case 'root':
				throw new Error(
					`Failed to find closest repeat range to node with reference: ${fromNode.currentState.reference}`
				);

			case 'repeat-range':
				return currentNode;

			case 'repeat-instance':
				return currentNode.parent;

			case 'group':
			case 'subtree':
			case 'string':
			case 'select':
				return this.getClosestRepeatRange(currentNode.parent);

			default:
				throw new UnreachableError(currentNode);
		}
	}

	createNewRepeat(repeatNodeset: string): unknown {
		const question = this.selectedQuestion();

		this.assertNodeset(question, repeatNodeset);

		const repeatRange = this.getClosestRepeatRange(question.node);

		repeatRange.addInstances();

		const instances = repeatRange.currentState.children;
		const instance = instances[instances.length - 1]!;
		const instanceQuestion = RepeatInstanceQuestion.createSingleton(instance);
		const index = this.questions().indexOf(instanceQuestion);

		this.setQuestionIndex(() => index, instance.currentState.reference);

		return;
	}
}
