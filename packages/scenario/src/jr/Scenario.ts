import type { XFormsElement } from '@getodk/common/test/fixtures/xform-dsl/XFormsElement.ts';
import type { AnyNode, RepeatRangeNode, RootNode, SelectNode } from '@getodk/xforms-engine';
import type { Accessor, Setter } from 'solid-js';
import { createMemo, createSignal, runWithOwner } from 'solid-js';
import { afterEach, expect } from 'vitest';
import { SelectValuesAnswer } from '../answer/SelectValuesAnswer.ts';
import type { ValueNodeAnswer } from '../answer/ValueNodeAnswer.ts';
import { answerOf } from '../client/answerOf.ts';
import type { TestFormResource } from '../client/init.ts';
import { initializeTestForm } from '../client/init.ts';
import { getClosestRepeatRange, getNodeForReference } from '../client/traversal.ts';
import { ImplementationPendingError } from '../error/ImplementationPendingError.ts';
import { UnclearApplicabilityError } from '../error/UnclearApplicabilityError.ts';
import type { JRFormEntryCaption } from './caption/JRFormEntryCaption.ts';
import type { BeginningOfFormEvent } from './event/BeginningOfFormEvent.ts';
import type { EndOfFormEvent } from './event/EndOfFormEvent.ts';
import { PositionalEvent } from './event/PositionalEvent.ts';
import type { QuestionNodeType } from './event/QuestionEvent.ts';
import { RepeatInstanceEvent } from './event/RepeatInstanceEvent.ts';
import type { SelectQuestionEvent } from './event/SelectQuestionEvent.ts';
import {
	getPositionalEvents,
	type AnyPositionalEvent,
	type NonTerminalPositionalEvent,
	type PositionalEvents,
} from './event/getPositionalEvents.ts';
import { isQuestionEventOfType, type TypedQuestionEvent } from './event/predicates.ts';
import { JRFormDef } from './form/JRFormDef.ts';
import { JRFormIndex } from './form/JRFormIndex.ts';
import type { FormDefinitionResource } from './resource/FormDefinitionResource.ts';
import { r } from './resource/ResourcePathHelper.ts';
import { SelectChoiceList } from './select/SelectChoiceList.ts';
import { ValidateOutcome } from './validation/ValidateOutcome.ts';
import { JREvaluationContext } from './xpath/JREvaluationContext.ts';
import { JRTreeReference } from './xpath/JRTreeReference.ts';

interface ScenarioConstructorOptions {
	readonly dispose: VoidFunction;
	readonly formName: string;
	readonly instanceRoot: RootNode;
}

type FormFileName = `${string}.xml`;

const isFormFileName = (value: FormDefinitionResource | string): value is FormFileName => {
	return typeof value === 'string' && value.endsWith('.xml');
};

// prettier-ignore
type ScenarioStaticInitParameters =
	| readonly [formFileName: FormFileName]
	| readonly [formName: string, form: XFormsElement]
	| readonly [resource: FormDefinitionResource];

interface AssertCurrentReferenceOptions {
	readonly assertCurrentReference: string;
}

/**
 * @see {@link Scenario.createNewRepeat} for details
 */
interface CreateNewRepeatAssertedReferenceOptions {
	readonly assertCurrentReference: string;
}

export interface ExplicitRepeatCreationOptions {
	readonly explicitRepeatCreation: boolean;
}

// prettier-ignore
type GetQuestionAtIndexParameters<
	ExpectedQuestionType extends QuestionNodeType
> = readonly [
	expectedType?: ExpectedQuestionType | null
];

type AnswerSelectParameters = readonly [reference: string, ...selectionValues: string[]];

// prettier-ignore
type AnswerParameters =
	| AnswerSelectParameters
	| readonly [reference: string, value: unknown]
	| readonly [value: unknown];

const isAnswerSelectParams = (args: AnswerParameters): args is AnswerSelectParameters => {
	return args.length > 2 && args.every((arg) => typeof arg === 'string');
};

/**
 * **PORTING NOTES**
 *
 * At this point I think I'm far enough along in the porting process to make
 * some general, global/cross-cutting observations. This is where I'll put them
 * as they come up.
 *
 * _Wishlist_
 *
 * 0. If I could wave a magic wand and instantly change any one thing about the
 *    JavaRosa tests, it would be to eliminate method/function signature
 *    overloading. Not only does it translate poorly to TypeScript (which does
 *    support overloading at the type level, but **does not** have any special
 *    runtime facility for dispatch based on distinct signatures), it makes
 *    reasoning about differently shaped calls to the same method/function
 *    really difficult! In some cases, these overloads kind of fall into a
 *    common pattern with trailing optional parameters. That's idiomatic in both
 *    environments (and at least transferrible to any language I can think of).
 *    But some signatures are so disparate that they're almost begging to be
 *    distinct routines with distinct names, or named options, or some other way
 *    to clarify their branchiness at both call and implementation sites.
 */
export class Scenario {
	static async init<This extends typeof Scenario>(
		this: This,
		...args: ScenarioStaticInitParameters
	): Promise<This['prototype']> {
		let resource: TestFormResource;
		let formName: string;

		if (isFormFileName(args[0])) {
			return this.init(r(args[0]));
		} else if (args.length === 1) {
			const [pathResource] = args;
			resource = pathResource;
			formName = pathResource.formName;
		} else {
			const [name, form] = args;

			formName = name;
			resource = form;
		}

		const { dispose, owner, instanceRoot } = await initializeTestForm(resource);

		return runWithOwner(owner, () => {
			return new this({
				dispose,
				formName,
				instanceRoot,
			});
		})!;
	}

	readonly formName: string;
	readonly instanceRoot: RootNode;

	private readonly getPositionalEvents: Accessor<PositionalEvents>;
	private readonly setEventPosition: Setter<number>;

	protected readonly getSelectedPositionalEvent: Accessor<AnyPositionalEvent>;

	protected constructor(options: ScenarioConstructorOptions) {
		const { dispose, formName, instanceRoot } = options;

		this.formName = formName;
		this.instanceRoot = instanceRoot;

		const [eventPosition, setEventPosition] = createSignal(0);

		this.getPositionalEvents = () => getPositionalEvents(instanceRoot);
		this.setEventPosition = setEventPosition;

		this.getSelectedPositionalEvent = createMemo(() => {
			const events = getPositionalEvents(instanceRoot);
			const position = eventPosition();
			const event = events[position];

			if (event == null) {
				throw new Error(`No question at position: ${position}`);
			}

			return event;
		});

		afterEach(() => {
			PositionalEvent.cleanup();
			dispose();
		});
	}

	private assertNonTerminalEventSelected(
		event: AnyPositionalEvent
	): asserts event is NonTerminalPositionalEvent {
		expect(event.eventType).not.toBe('BEGINNING_OF_FORM');
		expect(event.eventType).not.toBe('END_OF_FORM');
	}

	private assertReference(
		question: AnyPositionalEvent,
		reference: string
	): asserts question is NonTerminalPositionalEvent {
		this.assertNonTerminalEventSelected(question);

		expect(question.node.currentState.reference).toBe(reference);
	}

	private assertTerminalEvent(
		event: AnyPositionalEvent,
		eventType: 'BEGINNING_OF_FORM'
	): asserts event is BeginningOfFormEvent;
	private assertTerminalEvent(
		event: AnyPositionalEvent,
		eventType: 'END_OF_FORM'
	): asserts event is EndOfFormEvent;
	private assertTerminalEvent(
		event: AnyPositionalEvent,
		eventType: 'BEGINNING_OF_FORM' | 'END_OF_FORM'
	) {
		expect(event.eventType).toBe(eventType);
	}

	private setNonTerminalEventPosition(
		callback: (current: number) => number,
		expectReference: string
	): NonTerminalPositionalEvent {
		this.setEventPosition(callback);

		const event = this.getSelectedPositionalEvent();

		this.assertNonTerminalEventSelected(event);

		if (expectReference != null) {
			this.assertReference(event, expectReference);
		}

		return event;
	}

	jumpToBeginningOfForm(): void {
		this.setEventPosition(0);
	}

	getQuestionAtIndex<ExpectedQuestionType extends QuestionNodeType>(
		...[expectedType = null]: GetQuestionAtIndexParameters<ExpectedQuestionType>
	): TypedQuestionEvent<ExpectedQuestionType> {
		const event = this.getSelectedPositionalEvent();

		if (!isQuestionEventOfType(event, expectedType)) {
			throw new Error(`Expected positional event of type ${expectedType}, got ${event.eventType}`);
		}

		return event;
	}

	/**
	 * @param expectReference - `'BEGINNING_OF_FORM'` may be passed if the call is
	 * expected to advance the positional state to the beginning of the form.
	 * (This is considered safe, albeit somewhat awkward, on the basis that it
	 * isn't expected to be a valid XPath reference in any test fixtures.)
	 *
	 * @todo consider signature overload, conceptually similar to the one
	 * introduced for {@link createNewRepeat}?
	 */
	prev(expectReference: string): BeginningOfFormEvent | NonTerminalPositionalEvent {
		const decrement = (current: number): number => current - 1;

		if (expectReference === 'BEGINNING_OF_FORM') {
			this.setEventPosition(decrement);

			const event = this.getSelectedPositionalEvent();

			this.assertTerminalEvent(event, 'BEGINNING_OF_FORM');

			return event;
		}

		return this.setNonTerminalEventPosition(decrement, expectReference);
	}

	/**
	 * @param expectReference - `'END_OF_FORM'` may be passed if the call is
	 * expected to advance the positional state to the end of the form. (This is
	 * considered safe, albeit somewhat awkward, on the basis that it isn't
	 * expected to be a valid XPath reference in any test fixtures.)
	 *
	 * @todo consider signature overload, conceptually similar to the one
	 * introduced for {@link createNewRepeat}?
	 */
	next(expectReference: string): EndOfFormEvent | NonTerminalPositionalEvent {
		const increment = (current: number): number => current + 1;

		if (expectReference === 'END_OF_FORM') {
			this.setEventPosition(increment);

			const event = this.getSelectedPositionalEvent();

			this.assertTerminalEvent(event, 'END_OF_FORM');

			return event;
		}

		return this.setNonTerminalEventPosition(increment, expectReference);
	}

	private getPositionalStateForReference(reference: string): AnyPositionalEvent | null {
		const events = this.getPositionalEvents();

		return (
			events.find(({ node }) => {
				return node?.currentState.reference === reference;
			}) ?? null
		);
	}

	private setPositionalStateToReference(reference: string): AnyPositionalEvent {
		const events = this.getPositionalEvents();
		const index = events.findIndex(({ node }) => {
			return node?.currentState.reference === reference;
		});

		if (index === -1) {
			this.logMissingRepeatAncestor(reference);

			throw new Error(
				`Setting answer to ${reference} failed: could not locate question/positional event with that reference.`
			);
		}

		return this.setNonTerminalEventPosition(() => index, reference);
	}

	private answerSelect(reference: string, ...selectionValues: string[]): ValueNodeAnswer {
		const event = this.setPositionalStateToReference(reference);

		if (!isQuestionEventOfType(event, 'select')) {
			throw new Error(
				`Cannot set selection values for reference ${reference}: event is type ${event.eventType}, node is type ${event.node?.nodeType}`
			);
		}

		return event.answerQuestion(new SelectValuesAnswer(selectionValues));
	}

	answer(...args: AnswerParameters): ValueNodeAnswer {
		if (isAnswerSelectParams(args)) {
			return this.answerSelect(...args);
		}

		const [arg0, arg1, ...rest] = args;

		if (rest.length > 0) {
			throw new Error('Unexpected `answer` call of arity > 2');
		}

		let event: AnyPositionalEvent;
		let value: unknown;

		if (arg1 === undefined) {
			event = this.getSelectedPositionalEvent();
			value = arg0;
		} else if (typeof arg0 === 'string') {
			const reference = arg0;

			event = this.setPositionalStateToReference(reference);
			value = arg1;
		} else {
			throw new Error('Unsupported `answer` overload call');
		}

		if (event.eventType === 'BEGINNING_OF_FORM') {
			throw new Error('Cannot answer question, beginning of form is selected');
		}

		if (event.eventType === 'END_OF_FORM') {
			throw new Error('Cannot answer question, end of form is selected');
		}

		if (event.eventType !== 'QUESTION') {
			throw new Error(`Cannot answer question of type ${event.node.definition.type}`);
		}

		return event.answerQuestion(value);
	}

	answerOf(reference: string): ValueNodeAnswer {
		return answerOf(this.instanceRoot, reference);
	}

	/**
	 * **PORTING NOTES**
	 *
	 * In JavaRosa, this method is named `getAnswerNode`. A previous iteration of
	 * this note discussed giving it a more general name, and we landed on this in
	 * review. This note should be removed if JavaRosa is updated to match.
	 */
	getInstanceNode(reference: string): AnyNode {
		const node = getNodeForReference(this.instanceRoot, reference);

		if (node == null) {
			throw new Error(`No "answer" node for reference: ${reference}`);
		}

		return node;
	}

	choicesOf(reference: string): SelectChoiceList {
		const events = this.getPositionalEvents();
		// TODO: generalize more lookups...
		const event = events.find(({ node }) => {
			return node?.currentState.reference === reference;
		});

		if (event == null || event.eventType !== 'QUESTION' || event.node.nodeType !== 'select') {
			throw new Error(`No choices for reference: ${reference}`);
		}

		const { node } = event;

		return new SelectChoiceList(node);
	}

	/**
	 * Note: In JavaRosa, {@link Scenario.createNewRepeat} accepts either:
	 *
	 * - a nodeset reference, specifying where to create a new repeat instance
	 *   (regardless of the current positional state within the form)
	 * - no parameter, implicitly creating a repeat instance at the current form
	 *   positional state (presumably resulting in test failure if the positional
	 *   state does not allow this)
	 *
	 * When we began porting JavaRosa tests, we agreed to make certain aspects of
	 * positional state more explicit, by passing the **expected** nodeset
	 * reference as a parameter to methods which would either mutate that state,
	 * or invoke any behavior which would be (implicitly) based on its current
	 * positional state. The idea was that this would both improve clarity of
	 * intent (inlining meta-information into a test's body about that test's
	 * state as it progresses) and somewhat improve resilience against regressions
	 * (by treating such reference parameters _as assertions_).
	 *
	 * We still consider these changes valuable, but it turned out that the way
	 * they were originally conceived conflicts with (at least) the current
	 * {@link Scenario.createNewRepeat} interface in JavaRosa. As such, that
	 * method's interface is revised again so that:
	 *
	 * - JavaRosa tests which **already pass** a nodeset reference preserve the
	 *   same semantics and behavior they currently have
	 * - Web forms tests introducing the clarifying/current-state-asserting
	 *   behavior need to be slightly more explicit, by passing an options object
	 *   to disambiguate the reference nodeset's intent
	 */
	createNewRepeat(
		assertionOptionsOrTargetReference: CreateNewRepeatAssertedReferenceOptions | string
	): unknown {
		let repeatReference: string;
		let event: AnyPositionalEvent;

		if (typeof assertionOptionsOrTargetReference === 'object') {
			const options = assertionOptionsOrTargetReference;
			const { assertCurrentReference } = options;

			event = this.getSelectedPositionalEvent();

			this.assertReference(event, assertCurrentReference);

			repeatReference = assertCurrentReference;
		} else {
			repeatReference = assertionOptionsOrTargetReference;

			event = this.setPositionalStateToReference(repeatReference);
		}

		if (event.eventType !== 'PROMPT_NEW_REPEAT') {
			throw new Error('Cannot create new repeat, ');
		}

		const { node } = event;

		// TODO: we should probably remove this when we add support for `jr:count`
		// and `jr:noAddRemove`. There will likely be other, engine/client API-level
		// restrictions which address this. For now, this is intended to ensure that
		// we don't mistakenly introduce new explicit repeat creation calls where
		// the repeat under test is count/fixed.
		if (!this.proposed_canCreateNewRepeat(repeatReference)) {
			throw new Error(`Repeat is/will be engine controlled: ${repeatReference}`);
		}

		const { reference } = node.currentState;
		const repeatRange = getClosestRepeatRange(node);

		if (repeatRange == null) {
			throw new Error(`Failed to find closest repeat range to node with reference: ${reference}`);
		}

		repeatRange.addInstances();

		const instances = repeatRange.currentState.children;
		const instance = instances[instances.length - 1]!;
		const instanceQuestion = RepeatInstanceEvent.from(instance);
		const index = this.getPositionalEvents().indexOf(instanceQuestion);

		this.setNonTerminalEventPosition(() => index, instance.currentState.reference);

		return;
	}

	/**
	 * Per JavaRosa:
	 *
	 * Removes the repeat instance corresponding to the provided reference
	 */
	removeRepeat(repeatNodeset: string): Scenario {
		const events = this.getPositionalEvents();
		const index = events.findIndex(({ node }) => {
			return node?.currentState.reference === repeatNodeset;
		});

		if (index === -1) {
			throw new Error(
				/**
				 * **PORTING NOTES**
				 *
				 * > I think the JR message is specifically related to the case where
				 * > you define a repeat in a form but don't put any children in it. I
				 * > think it was introduced in reaction to doing that accidentally and
				 * > being confused. I think it's specific because (in JR) adding a
				 * > child in the instance isn't enough, there also needs to be an
				 * > associated form control.
				 *
				 * {@link https://github.com/getodk/web-forms/pull/110#discussion_r1610523187}
				 *
				 * - - -
				 *
				 * JR: "Please add some field and a form control"
				 */
				`Removing repeat instance with nodeset ${repeatNodeset} failed: could not locate repeat instance with that reference.`
			);
		}

		const event = this.setNonTerminalEventPosition(() => index, repeatNodeset);

		if (event.node.nodeType !== 'repeat-instance') {
			throw new Error('Not a repeat instance');
		}

		const repeatRange = getClosestRepeatRange(event.node);

		if (repeatRange == null) {
			throw new Error('Cannot remove repeat instance, failed to find its parent repeat range');
		}

		if (!this.isClientControlled(repeatRange)) {
			throw new Error('Cannot remove repeat instance: repeat range is engine controlled');
		}

		const repeatIndex = repeatRange.currentState.children.indexOf(event.node);

		if (repeatIndex === -1) {
			throw new Error('Cannot remove repeat, not in range');
		}

		repeatRange.removeInstances(repeatIndex);

		return this;
	}

	setLanguage(languageName: string): void {
		const { instanceRoot } = this;

		const language = instanceRoot.languages.find((formLanguage) => {
			return formLanguage.language === languageName;
		});

		if (language == null || language.isSyntheticDefault) {
			throw new Error(`Form does not support language: ${languageName}`);
		}

		this.instanceRoot.setLanguage(language);
	}

	refAtIndex(): JRTreeReference {
		const event = this.getSelectedPositionalEvent();

		let treeReferenceNode: AnyNode;

		if (event.eventType === 'END_OF_FORM') {
			treeReferenceNode = this.instanceRoot;
		} else {
			treeReferenceNode = event.node;
		}

		return new JRTreeReference(treeReferenceNode.currentState.reference);
	}

	/**
	 * **PORTING NOTES**
	 *
	 * From
	 * {@link https://github.com/getodk/web-forms/pull/110#discussion_r1610546665 | this review comment}:
	 *
	 * > [JavaRosa] defines a compact format of its in-memory form representation.
	 * > Collect writes that out to disk after initial form parse and then always
	 * > reads form definitions from their serialized representation. This
	 * > improved performance greatly on older hardware and now only leads to
	 * > notable performance improvements on certain forms.
	 *
	 * @todo it is not clear if/how we'll use similar logic in web forms. It seems
	 * most likely to be applicable to offline capabilities.
	 */
	serializeAndDeserializeForm(): Promise<Scenario> {
		return Promise.reject(new UnclearApplicabilityError('serialization/deserialization'));
	}

	/**
	 * @todo JavaRosa mutates the {@link Scenario} instance itself. Do we actually
	 * want that? Deferred for now, at least until the porting process surfaces a
	 * test which would exercise it without being expected to fail beforehand for
	 * other reasons of unclear applicability.
	 */
	newInstance(): Promise<never> {
		return Promise.reject(new UnclearApplicabilityError('Scenario instance statefulness'));
	}

	getValidationOutcome(): ValidateOutcome {
		const [first, ...rest] = this.instanceRoot.validationState.violations;

		if (rest.length > 0) {
			throw new Error(
				'TODO: what is an appropriate form-/Scenario-level ValidationOutcome when there is more than one violation?'
			);
		}

		if (first == null) {
			return new ValidateOutcome(null, null);
		}

		const { reference, violation } = first;
		const failedPrompt = this.getPositionalStateForReference(reference);

		return new ValidateOutcome(failedPrompt, violation);
	}

	/**
	 * **PORTING NOTES**
	 *
	 * This currently deviates, intentionally, from JavaRosa interface, which
	 * returns an instance of `FormIndex` (a concept not present in web forms, and
	 * not currently anticipated). Since we already support JavaRosa's "event"
	 * concepts, and since this is a reference lookup, we'll let that type be a
	 * substitute for now.
	 *
	 * @todo This feels like a particular implementation detail we may want to
	 * scrutinize after porting.
	 */
	indexOf(reference: string): AnyPositionalEvent | null {
		return (
			this.getPositionalEvents().find((event) => {
				return event?.node?.currentState.reference === reference;
			}) ?? null
		);
	}

	countRepeatInstancesOf(reference: string): number {
		const node = this.getInstanceNode(reference);

		if (node.nodeType !== 'repeat-range') {
			return -1;
		}

		return node.currentState.children.length;
	}

	atQuestion(): boolean {
		const event = this.getSelectedPositionalEvent();

		return event.eventType === 'QUESTION';
	}

	/**
	 * @todo It is really unclear whether this method should go below in the
	 * "consider adapting tests" bag/vat. At least as encountered so far, it
	 * doesn't seem to serve much purpose other than as a control flow helper.
	 */
	atTheEndOfForm(): boolean {
		const event = this.getSelectedPositionalEvent();

		return event.eventType === 'END_OF_FORM';
	}

	private suppressMissingRepeatAncestorLogs = false;

	private logMissingRepeatAncestor(reference: string): void {
		if (this.suppressMissingRepeatAncestorLogs) {
			return;
		}

		const [, positionPredicatedReference, positionExpression] =
			reference.match(/^(.*\/[^/[]+)\[(\d+)\]\/[^[]+$/) ?? [];

		if (positionPredicatedReference == null || positionExpression == null) {
			return;
		}

		if (/\[\d+\]/.test(positionPredicatedReference)) {
			this.logMissingRepeatAncestor(positionPredicatedReference);
		}

		const position = parseInt(positionExpression, 10);

		if (Number.isNaN(position) || position < 1) {
			throw new Error(
				`Cannot log missing repeat ancestor for reference (invalid position predicate): ${reference} (repeatRangeReference: ${positionPredicatedReference}, positionExpression: ${positionExpression})`
			);
		}

		try {
			const ancestorNode = this.getInstanceNode(positionPredicatedReference);

			if (ancestorNode.nodeType !== 'repeat-range') {
				// eslint-disable-next-line no-console
				console.trace(
					'Unexpected position predicate for ancestor reference:',
					positionPredicatedReference,
					'position:',
					position
				);

				return;
			}

			if (!this.proposed_canCreateNewRepeat(positionPredicatedReference)) {
				return;
			}

			const index = position - 1;
			const repeatInstances = ancestorNode.currentState.children;

			if (repeatInstances[index] == null) {
				// eslint-disable-next-line no-console
				console.trace(
					'Missing repeat in range:',
					positionPredicatedReference,
					'position:',
					position,
					'index:',
					index,
					'actual instances present:',
					repeatInstances.length
				);
			}
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error(error);

			return;
		}
	}

	proposed_addExplicitCreateNewRepeatCallHere(
		reference: string,
		options: ExplicitRepeatCreationOptions
	): unknown {
		if (options.explicitRepeatCreation) {
			return this.createNewRepeat(reference);
		}

		this.suppressMissingRepeatAncestorLogs = true;

		return;
	}

	/** @todo this should change when we support `jr:count` */
	private isCountControlled(node: RepeatRangeNode): boolean {
		return node.definition.bodyElement.countExpression != null;
	}

	/** @todo this should change when we support `jr:noAddRemove` */
	private isFixedCount(node: RepeatRangeNode): boolean {
		return node.definition.bodyElement.isFixedCount;
	}

	private isClientControlled(node: RepeatRangeNode): boolean {
		return !this.isCountControlled(node) && !this.isFixedCount(node);
	}

	/**
	 * **PORTING NOTES**
	 *
	 * This method is proposed as an alternative to
	 * {@link JRFormDef.canCreateRepeat}, intended to be roughly equivalent in
	 * semantics without reliance on several aspects of JavaRosa internal APIs.
	 * The intent is that we might share test logic with JavaRosa exercising the
	 * question "can I create a repeat instance in this specified
	 * range/sequence/series?"
	 */
	proposed_canCreateNewRepeat(repeatRangeReference: string): boolean {
		const node = getNodeForReference(this.instanceRoot, repeatRangeReference);

		if (node == null) {
			return false;
		}

		if (node.nodeType !== 'repeat-range') {
			throw new Error(
				`Expected a repeat range with reference ${repeatRangeReference}, found a node of type ${node.nodeType}`
			);
		}

		return this.isClientControlled(node);
	}

	/**
	 * **PORTING NOTES**
	 *
	 * This method is proposed as an alternative to
	 * {@link JRFormEntryCaption.getQuestionText}, intended to:
	 *
	 * - intended to be roughly equivalent in semantics without reliance on that
	 *   class, viewed as an aspect of JavaRosa internal APIs
	 *
	 * - Provide similar positional semantics to other existing {@link Scenario}
	 *   methods/web forms extensions thereof, where the call site expresses the
	 *   expected XPath reference of the node at the current positional state.
	 */
	proposed_getQuestionLabelText(options: AssertCurrentReferenceOptions): string {
		const event = this.getSelectedPositionalEvent();

		this.assertReference(event, options.assertCurrentReference);

		const { currentState } = event.node;
		const label = currentState.label?.asString;

		if (label == null) {
			throw new Error(`Question node with reference ${currentState.reference} has no label`);
		}

		return label;
	}

	private getCurrentSelectNode(options: AssertCurrentReferenceOptions): SelectNode {
		const { assertCurrentReference } = options;
		const event = this.getSelectedPositionalEvent();

		this.assertReference(event, assertCurrentReference);

		if (event.eventType !== 'QUESTION') {
			throw new Error(`Expected a question event, got ${event.eventType}`);
		}

		const { node } = event;
		const { currentState, nodeType } = node;

		if (nodeType !== 'select') {
			throw new Error(`Expected node at ${currentState.reference} to be a select, got ${nodeType}`);
		}

		return node;
	}

	/**
	 * **PORTING NOTES**
	 *
	 * Proposed as a close semantic equivalent to JavaRosa's
	 * `FormEntryPrompt.getAnswerText`, as used in a testing context.
	 *
	 * This method is expected to be called when the current positional state is a
	 * reference to a {@link SelectQuestionEvent}, and will assert that based on
	 * the provided {@link AssertCurrentReferenceOptions.assertCurrentReference}
	 * option.
	 *
	 * The method's return value will be an array of strings, mapping each
	 * **selected item** (items included in the question node's
	 * `currentState.value`) to that item's label, as a serialized string.
	 *
	 * @todo At present, this maps the selected items their labels **if they have
	 * one**, otherwise falling back to their value. This is understood to be the
	 * intent for form display, but it's treated as a client concern. It may be
	 * something we want the engine to handle in the future, for greater
	 * inter-client consistency and to reduce the amount of test surface area
	 * that's effectively testing {@link Scenario}'s own behavior as a client.
	 */
	proposed_getSelectedOptionLabelsAsText(
		options: AssertCurrentReferenceOptions
	): readonly string[] {
		const node = this.getCurrentSelectNode(options);

		return node.currentState.value.map((item) => {
			return item.label?.asString ?? item.value;
		});
	}

	/**
	 * **PORTING NOTES**
	 *
	 * Used in supplemental tests, added to check **all** of a select's
	 * item/option labels, corresponding to tests calling
	 * {@link proposed_getSelectedOptionLabelsAsText}.
	 */
	proposed_getAvailableOptionLabels(options: AssertCurrentReferenceOptions): readonly string[] {
		const node = this.getCurrentSelectNode(options);

		return node.currentState.valueOptions.map((item) => {
			return item.label?.asString ?? item.value;
		});
	}

	proposed_getTitle(): string {
		throw new ImplementationPendingError('form title');
	}

	proposed_serializeInstance(): string {
		throw new ImplementationPendingError('instance serialization');
	}

	// TODO: consider adapting tests which use the following interfaces to use
	// more portable concepts (either by using conceptually similar `Scenario`
	// APIs, or by reframing the tests' logic to the same behavioral concerns with
	// better supported APIs)

	/**
	 * @todo Mark deprecated?
	 */
	getFormDef(): JRFormDef {
		return new JRFormDef(this);
	}

	/**
	 * @see {@link JREvaluationContext}
	 * @todo Mark deprecated?
	 */
	getEvaluationContext(): JREvaluationContext {
		return new JREvaluationContext();
	}

	/**
	 * @todo Mark deprecated?
	 */
	expandSingle(_treeReference: JRTreeReference): JRTreeReference {
		throw new UnclearApplicabilityError('XPath internals');
	}

	/**
	 * @todo Mark deprecated?
	 */
	getCurrentIndex(): JRFormIndex {
		return new JRFormIndex(this.getSelectedPositionalEvent());
	}

	/**
	 * @todo Mark deprecated?
	 */
	async serializeAndDeserializeInstance(form: XFormsElement): Promise<Scenario> {
		return Scenario.init(form.getName(), form);
	}
}

/**
 * JavaRosa exposes this as a static method on {@link Scenario}, but we expose
 * it as a named export as that is its typical usage in ported tests.
 *
 * @todo Mark deprecated?
 */
export const getRef = (xpathReference: string): JRTreeReference => {
	return new JRTreeReference(xpathReference);
};

const ANSWER_RESULT_OK = 'OK';
const ANSWER_RESULT_REQUIRED_BUT_EMPTY = 'REQUIRED_BUT_EMPTY';
const ANSWER_RESULT_CONSTRAINT_VIOLATED = 'CONSTRAINT_VIOLATED';

export enum AnswerResult {
	OK = ANSWER_RESULT_OK,
	REQUIRED_BUT_EMPTY = ANSWER_RESULT_REQUIRED_BUT_EMPTY,
	CONSTRAINT_VIOLATED = ANSWER_RESULT_CONSTRAINT_VIOLATED,
}
