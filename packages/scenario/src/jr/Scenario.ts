import type { XFormsElement } from '@getodk/common/test/fixtures/xform-dsl/XFormsElement.ts';
import { xmlElement } from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import type {
	AnyFormInstance,
	AnyNode,
	FormResource,
	InstancePayload,
	InstancePayloadOptions,
	InstancePayloadType,
	RepeatRangeControlledNode,
	RepeatRangeNode,
	RepeatRangeUncontrolledNode,
	RestoreFormInstanceInput,
	RootNode,
	SelectNode,
} from '@getodk/xforms-engine';
import { constants as ENGINE_CONSTANTS } from '@getodk/xforms-engine';
import type { Accessor, Owner, Setter } from 'solid-js';
import { createMemo, createSignal } from 'solid-js';
import { afterEach, assert, expect } from 'vitest';
import { RankValuesAnswer } from '../answer/RankValuesAnswer.ts';
import { SelectValuesAnswer } from '../answer/SelectValuesAnswer.ts';
import type { ValueNodeAnswer } from '../answer/ValueNodeAnswer.ts';
import { answerOf } from '../client/answerOf.ts';
import { editInstance } from '../client/editInstance.ts';
import type { InitializableForm, TestFormOptions } from '../client/init.ts';
import { initializeTestForm } from '../client/init.ts';
import { isRepeatRange } from '../client/predicates.ts';
import { runInSolidScope } from '../client/solid-helpers.ts';
import { getClosestRepeatRange, getNodeForReference } from '../client/traversal.ts';
import { ImplementationPendingError } from '../error/ImplementationPendingError.ts';
import { UnclearApplicabilityError } from '../error/UnclearApplicabilityError.ts';
import type { ReactiveScenario } from '../reactive/ReactiveScenario.ts';
import { SharedJRResourceService } from '../resources/SharedJRResourceService.ts';
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

/**
 * Satisfies the xforms-engine client `stateFactory` option. Currently this is
 * intentionally **not** reactive, as scenario tests ported/derived from
 * JavaRosa's test suite do not explicitly exercise any reactive aspects of the
 * engine/client interface.
 *
 * This identity function is used as the default
 * {@link ScenarioConstructorOptions.stateFactory} for tests using
 * {@link Scenario.init}.
 *
 * The {@link ReactiveScenario} subclass provides a default client reactivity
 * implementation for tests directly exercising the engine's reactive APIs and
 * behaviors.
 */
const nonReactiveIdentityStateFactory = <T extends object>(value: T): T => value;

interface ScenarioFormMeta {
	readonly formName: string;
	readonly formElement: XFormsElement;
	readonly formOptions: TestFormOptions;
}

export interface ScenarioConfig extends ScenarioFormMeta {
	readonly owner: Owner;
	readonly dispose: VoidFunction;
}

type FormFileName = `${string}.xml`;

const isFormFileName = (value: FormDefinitionResource | string): value is FormFileName => {
	return typeof value === 'string' && value.endsWith('.xml');
};

// prettier-ignore
type ScenarioStaticInitParameters =
	| readonly [formFileName: FormFileName]
	| readonly [formName: string, form: XFormsElement, overrideOptions?: Partial<TestFormOptions>]
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

type AnswerItemCollectionParameters = readonly [reference: string, ...selectionValues: string[]];

// prettier-ignore
type AnswerParameters =
	| AnswerItemCollectionParameters
	| readonly [reference: string, value: unknown]
	| readonly [value: unknown];

const isAnswerItemCollectionParams = (
	args: AnswerParameters
): args is AnswerItemCollectionParameters => {
	return args.length > 2 && args.every((arg) => typeof arg === 'string');
};

type ScenarioClass = typeof Scenario;

export interface ScenarioConstructor<T extends Scenario = Scenario> extends ScenarioClass {
	new (meta: ScenarioConfig, form: InitializableForm, instanceRoot: RootNode): T;
}

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
	/**
	 * To be overridden, e.g. by {@link ReactiveScenario}.
	 */
	static getTestFormOptions(overrideOptions?: Partial<TestFormOptions>): TestFormOptions {
		return {
			resourceService: overrideOptions?.resourceService ?? SharedJRResourceService.init(),
			missingResourceBehavior:
				overrideOptions?.missingResourceBehavior ??
				ENGINE_CONSTANTS.MISSING_RESOURCE_BEHAVIOR.DEFAULT,
			stateFactory: overrideOptions?.stateFactory ?? nonReactiveIdentityStateFactory,
			instanceAttachments: {
				fileNameFactory: ({ basename, extension }) => `${basename}${extension ?? ''}`,
				...overrideOptions?.instanceAttachments,
			},
		};
	}

	static async init<This extends typeof Scenario>(
		this: This,
		...args: ScenarioStaticInitParameters
	): Promise<This['prototype']> {
		let formMeta: ScenarioFormMeta;

		if (isFormFileName(args[0])) {
			return this.init(r(args[0]));
		} else if (args.length === 1) {
			const [resource] = args;

			formMeta = {
				formElement: xmlElement(resource.textContents),
				formName: resource.formName,
				formOptions: this.getTestFormOptions(),
			};
		} else {
			const [formName, formElement, overrideOptions] = args;

			formMeta = {
				formName,
				formElement,
				formOptions: this.getTestFormOptions(overrideOptions),
			};
		}

		const { dispose, owner, form, instanceRoot } = await initializeTestForm(
			formMeta.formElement.asXml() satisfies FormResource,
			formMeta.formOptions
		);

		return runInSolidScope(owner, () => {
			return new this(
				{
					...formMeta,
					owner,
					dispose,
				},
				form,
				instanceRoot
			);
		});
	}

	declare readonly ['constructor']: ScenarioConstructor<this>;

	protected readonly getPositionalEvents: Accessor<PositionalEvents>;

	protected readonly getEventPosition: Accessor<number>;
	private readonly setEventPosition: Setter<number>;

	protected readonly getSelectedPositionalEvent: Accessor<AnyPositionalEvent>;

	protected constructor(
		private readonly config: ScenarioConfig,
		private readonly form: InitializableForm,
		readonly instanceRoot: RootNode
	) {
		const [getEventPosition, setEventPosition] = createSignal(0);

		this.getPositionalEvents = () => getPositionalEvents(instanceRoot);
		this.getEventPosition = getEventPosition;
		this.setEventPosition = setEventPosition;

		this.getSelectedPositionalEvent = createMemo(() => {
			const events = getPositionalEvents(instanceRoot);
			const position = getEventPosition();
			const event = events[position];

			if (event == null) {
				throw new Error(`No question at position: ${position}`);
			}

			return event;
		});

		afterEach(() => {
			PositionalEvent.cleanup();
			config.dispose();
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

	private answerItemCollectionQuestion(
		reference: string,
		...selectionValues: string[]
	): ValueNodeAnswer {
		const event = this.setPositionalStateToReference(reference);
		const isSelect = isQuestionEventOfType(event, 'select');
		const isRank = isQuestionEventOfType(event, 'rank');

		if (!(isSelect || isRank)) {
			throw new Error(
				`Cannot set values for reference ${reference}: event is type ${event.eventType}, node is type ${event.node?.nodeType}`
			);
		}

		if (isRank) {
			return event.answerQuestion(new RankValuesAnswer(selectionValues));
		}

		return event.answerQuestion(new SelectValuesAnswer(selectionValues));
	}

	answer(...args: AnswerParameters): ValueNodeAnswer {
		if (isAnswerItemCollectionParams(args)) {
			return this.answerItemCollectionQuestion(...args);
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
			throw new Error(`No instance node for reference: ${reference}`);
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

		if (!this.isClientControlled(node)) {
			throw new Error(`Repeat is engine controlled: ${repeatReference}`);
		}

		const { reference } = node.currentState;
		const repeatRange = getClosestRepeatRange(node);

		if (repeatRange == null) {
			throw new Error(`Failed to find closest repeat range to node with reference: ${reference}`);
		}

		if (!this.isClientControlled(repeatRange)) {
			throw new Error('Cannot remove repeat instance: repeat range is engine controlled');
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
	 * At time of writing, this comment contains the following sections:
	 *
	 * 1. JavaRosa's current JavaDoc comment for the same-named method.
	 * 2. Revised understanding of the intended semantics of the method as it
	 *    exists in JavaRosa, and notes on the accuracy of that JavaDoc comment
	 *    relative to observations of its call sites.
	 * 3. Revised explanation of our current deferral of the method's
	 *    implemenation, as relates to that understanding.
	 * 4. A quote describing conceptual context for the method's origin in
	 *    JavaRosa (as preserved from review of the first pass porting JavaRosa
	 *    tests to Web Forms).
	 *
	 * - - -
	 *
	 * {@link https://github.com/getodk/javarosa/blob/7986abae78dc0dfe8715fa0071cd04ab698db9bb/src/main/java/org/javarosa/test/Scenario.java#L265-L268 | JR}:
	 *
	 * > Returns a new Scenario instance using a new form obtained by serializing
	 * > and deserializing the form being used by this instance.
	 *
	 * - - -
	 *
	 * Observing call sites of this method, in tests as they are written in
	 * JavaRosa (and as they've been ported to Web Forms), the above comment is
	 * misleading and incomplete! The **semantic intent** of the method—as named
	 * and as clarified in conversation with @lognaturel—is to serialize and
	 * deserialize a **form definition** (presumably including attachments and any
	 * other requisite data _relating to the form definition itself_).
	 *
	 * Actual usage in practice frequently goes well beyond that semantic intent!
	 * In usage, what is actually serialized and deserialized is the composition
	 * of:
	 *
	 * - form definition (etc)
	 * - instance state, equivalent to
	 *   {@link proposed_serializeAndRestoreInstanceState} (and roughly equivalent
	 *   to {@link serializeAndDeserializeInstance})
	 *
	 * We have already updated some of ported call sites to this method to reflect
	 * this mismatch of semantic intent. We will likely make the same change to
	 * many other call sites, where the same mismatched intent is presumed, and as
	 * functionality progresses to make the affected tests pertinent.
	 *
	 * - - -
	 *
	 * We have deferred implementation of this method pending support for **form
	 * definition serde** (including form attachments, potentially other
	 * metadata). Our _reasons_ for implementing such functionality will likely be
	 * different from JavaRosa's (detailed in the quote below, which was
	 * reiterated almost verbatim in conversation with @lognaturel yesterday!).
	 * But we will almost certainly implement it! It'll be useful to retain this
	 * method for its original semantic intent, even as many other call sites
	 * drift from it.
	 *
	 * - - -
	 *
	 * **PORTING NOTES** (PRESERVED FROM EARIER ITERATIONS)
	 *
	 * From
	 * {@link https://github.com/getodk/web-forms/pull/110#discussion_r1610546665 | this review comment}:
	 *
	 * > [JavaRosa] defines a compact format of its in-memory form representation.
	 * > Collect writes that out to disk after initial form parse and then always
	 * > reads form definitions from their serialized representation. This
	 * > improved performance greatly on older hardware and now only leads to
	 * > notable performance improvements on certain forms.
	 */
	serializeAndDeserializeForm(): Promise<this> {
		return Promise.reject(
			new ImplementationPendingError('Form definition serialization/deserialization')
		);
	}

	/**
	 * **PORTING NOTES**
	 *
	 * We previously deferred implementation of this method. We noted at the time
	 * that, upon its implementation, we'd likely want to revise its signature to
	 * reflect that it returns a new {@link Scenario} class instance, rather than
	 * performing a stateful operation on the same object.
	 *
	 * The engine now supports this method's functionality with a clear conceptual
	 * equivalent, and so the method is now implemented, differing from JavaRosa's
	 * signature/statefulness just as we anticipated.
	 *
	 * To be absolutely clear: tests calling this method **MUST** reference the
	 * returned {@link Scenario} class instance to use the (form) instance created
	 * by this method. References to the source {@link Scenario} object are (and
	 * will remain) unaffected by those calls.
	 */
	newInstance(): this {
		return this.fork(this.form.createInstance());
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

		if (!isRepeatRange(node)) {
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
			/^(.*\/[^/[]+)\[(\d+)\]\/[^[]+$/.exec(reference) ?? [];

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

			if (!isRepeatRange(ancestorNode)) {
				// eslint-disable-next-line no-console
				console.trace(
					'Unexpected position predicate for ancestor reference:',
					positionPredicatedReference,
					'position:',
					position
				);

				return;
			}

			if (!this.proposed_canCreateOrRemoveRepeat(positionPredicatedReference)) {
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

	private isCountControlled(node: RepeatRangeNode): node is RepeatRangeControlledNode {
		return node.nodeType === 'repeat-range:controlled';
	}

	private isClientControlled(node: RepeatRangeNode): node is RepeatRangeUncontrolledNode {
		return !this.isCountControlled(node);
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
	proposed_canCreateOrRemoveRepeat(repeatRangeReference: string): boolean {
		const node = getNodeForReference(this.instanceRoot, repeatRangeReference);

		if (node == null) {
			return false;
		}

		if (!isRepeatRange(node)) {
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
			const option = node.getValueOption(item);

			assert(option != null);

			return option.label.asString;
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
			return item.label.asString;
		});
	}

	proposed_getTitle(): string {
		throw new ImplementationPendingError('form title');
	}

	proposed_serializeInstance(): string {
		return this.instanceRoot.instanceState.instanceXML;
	}

	/**
	 * @todo Name is currently Web Forms-specific, pending question on whether
	 * this feature set is novel to Web Forms. If it is novel, isn't clear whether
	 * it would be appropriate to propose an equivalent JavaRosa method. Find out
	 * more about Collect's responsibility for submission (beyond serialization,
	 * already handled by {@link proposed_serializeInstance}).
	 */
	prepareWebFormsInstancePayload<PayloadType extends InstancePayloadType>(
		options: InstancePayloadOptions<PayloadType> = {
			payloadType: 'monolithic',
		} as InstancePayloadOptions<PayloadType>
	): Promise<InstancePayload<PayloadType>> {
		return this.instanceRoot.prepareInstancePayload(options);
	}

	/**
	 * @todo Naming? The name here was chosen to indicate this creates a "fork" of various aspects of a {@link Scenario} instance (most of which are internal/class-private) with a new {@link RootNode | form instance root} (derived from the current {@link Scenario} instance's {@link })
	 */
	private fork(instance: AnyFormInstance): this {
		return runInSolidScope(this.config.owner, () => {
			return new this.constructor(this.config, this.form, instance.root);
		});
	}

	async restoreWebFormsInstanceState(payload: RestoreFormInstanceInput): Promise<this> {
		const instance = await this.form.restoreInstance(payload, this.config.formOptions);

		return this.fork(instance);
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
	 * @deprecated
	 *
	 * @see {@link proposed_serializeAndRestoreInstanceState}, which is almost
	 * certainly what you want if you're looking here!
	 *
	 * **PORTING NOTES**
	 *
	 * This method's deprecation is Web Forms-specific! This is **NOT** intended
	 * to suggest deprecation in JavaRosa! It is meant to guide usage toward this
	 * method's
	 * {@link proposed_serializeAndRestoreInstanceState | proposed spiritual successor},
	 * which is conceptually equivalent except for the methods' respective
	 * parameter signatures.
	 *
	 * Below, as quoted from JavaRosa's comment on the same-named method,
	 * describes the reasoning for its {@link form} parameter.
	 *
	 * - - -
	 *
	 * {@link https://github.com/getodk/javarosa/blob/7986abae78dc0dfe8715fa0071cd04ab698db9bb/src/main/java/org/javarosa/test/Scenario.java#L290-L293 | JR}:
	 *
	 * > The fact that we need to pass in the same raw form definition that the
	 * > current scenario is built around suggests that
	 * > XFormParser.loadXmlInstance(FormDef f, Reader xmlReader) should probably
	 * > be public. This is also the method that Collect copies because the
	 * > FormDef may be built from cache meaning there won't be a Reader/Document
	 * > available and because it makes some extra calls for search(). We pass in
	 * > an XFormsElement for now until we decide on an interface that Collect can
	 * > use.
	 *
	 * - - -
	 *
	 * At time of writing, there is only one test calling this method (both as
	 * ported and in JavaRosa!). That call site is currently preserved, at least
	 * pending review of this commentary to confirm we want to swap its usage
	 * locally (a permanent divergence from JavaRosa on that single test).
	 */
	async serializeAndDeserializeInstance(form: XFormsElement): Promise<this> {
		expect(
			form.asXml(),
			'Attempted to serialize instance with unexpected form XML. Is instance from an unrelated form?'
		).toBe(this.config.formElement.asXml());

		return this.proposed_serializeAndRestoreInstanceState();
	}

	/**
	 * **PORTING NOTES**
	 *
	 * As proposed and implemented here, this method is:
	 *
	 * - Semantically equivalent to the **intent** of
	 *   {@link serializeAndDeserializeInstance}, except that it skips JavaRosa
	 *   inside baseball requiring a "form" parameter. We retain all requisite
	 *   references to perform this operation.
	 *
	 * - _Also expected_ to be called in place of several JavaRosa-ported calls to
	 *   {@link serializeAndDeserializeForm}, where tests clearly _intend to
	 *   express this method's semantics_. These semantics are distinct from the
	 *   **intent** of {@link serializeAndDeserializeForm}: as its name suggests,
	 *   the intent is **NOT** to serialize instance state. That it does probably
	 *   reflects the fact that JavaRosa's `FormDef` implements _both_ form
	 *   definition and instance state.
	 */
	async proposed_serializeAndRestoreInstanceState(): Promise<this> {
		const payload = await this.instanceRoot.prepareInstancePayload();

		return this.restoreWebFormsInstanceState(payload);
	}

	/** @see {@link editInstance} */
	async proposed_editCurrentInstanceState(): Promise<this> {
		const instance = await editInstance(this.form, this.instanceRoot);

		return this.fork(instance);
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
