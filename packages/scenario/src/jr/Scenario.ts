import type { XFormsElement } from '@getodk/common/test/fixtures/xform-dsl/XFormsElement.ts';
import type { RootNode } from '@getodk/xforms-engine';
import type { Accessor, Setter } from 'solid-js';
import { createMemo, createSignal, runWithOwner } from 'solid-js';
import { afterEach, expect } from 'vitest';
import type { ComparableAnswer } from '../answer/ComparableAnswer.ts';
import { answerOf } from '../client/answerOf.ts';
import type { TestFormResource } from '../client/init.ts';
import { initializeTestForm } from '../client/init.ts';
import { getClosestRepeatRange } from '../client/traversal.ts';
import { PositionalEvent } from './event/PositionalEvent.ts';
import { RepeatInstanceEvent } from './event/RepeatInstanceEvent.ts';
import {
	getPositionalEvents,
	type AnyPositionalEvent,
	type NonTerminalPositionalEvent,
	type PositionalEvents,
} from './event/getPositionalEvents.ts';
import type { PathResource } from './resource/PathResource.ts';
import { SelectChoiceList } from './select/SelectChoiceList.ts';

interface ScenarioConstructorOptions {
	readonly formName: string;
	readonly instanceRoot: RootNode;
}

// prettier-ignore
type ScenarioStaticInit =
	| ((formName: string, form: XFormsElement) => Promise<Scenario>)
	| ((resource: PathResource) => Promise<Scenario>);

export class Scenario {
	static async init(...args: Parameters<ScenarioStaticInit>): Promise<Scenario> {
		let resource: TestFormResource;
		let formName: string;

		if (args.length === 1) {
			const [pathResource] = args;
			resource = pathResource;
			formName = pathResource.formName;
		} else {
			const [name, form] = args;

			formName = name;
			resource = form;
		}

		const { owner, instanceRoot } = await initializeTestForm(resource);

		return runWithOwner(owner, () => {
			return new this({
				formName,
				instanceRoot,
			});
		})!;
	}

	readonly formName: string;
	readonly instanceRoot: RootNode;

	private readonly getPositionalEvents: Accessor<PositionalEvents>;
	private readonly setEventPosition: Setter<number>;
	private readonly getSelectedPositionalEvent: Accessor<AnyPositionalEvent>;

	private constructor(options: ScenarioConstructorOptions) {
		const { formName, instanceRoot } = options;

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
		});
	}

	private assertNonTerminalEventSelected(
		event: AnyPositionalEvent
	): asserts event is NonTerminalPositionalEvent {
		expect(event.eventType).not.toBe('BEGINNING_OF_FORM');
		expect(event.eventType).not.toBe('END_OF_FORM');
	}

	private assertNodeset(
		event: AnyPositionalEvent,
		nodeset: string
	): asserts event is NonTerminalPositionalEvent {
		this.assertNonTerminalEventSelected(event);

		expect(event.node.definition.nodeset).toBe(nodeset);
	}

	private assertReference(
		question: AnyPositionalEvent,
		reference: string
	): asserts question is NonTerminalPositionalEvent {
		this.assertNonTerminalEventSelected(question);

		expect(question.node.currentState.reference).toBe(reference);
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

	next(expectReference: string): NonTerminalPositionalEvent {
		const increment = (current: number): number => current + 1;

		return this.setNonTerminalEventPosition(increment, expectReference);
	}

	answer(reference: string, value: unknown): unknown;
	answer(value: unknown): unknown;
	answer(...[arg0, arg1]: [reference: string, value: unknown] | [value: unknown]): unknown {
		let event: AnyPositionalEvent;
		let value: unknown;

		if (arg1 === undefined) {
			event = this.getSelectedPositionalEvent();
			value = arg0;
		} else if (typeof arg0 === 'string') {
			const events = this.getPositionalEvents();
			const reference = arg0;
			const index = events.findIndex(({ node }) => {
				return node?.currentState.reference === reference;
			});

			event = this.setNonTerminalEventPosition(() => index, reference);

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

		event.answerQuestion(value);

		return;
	}

	answerOf(reference: string): ComparableAnswer {
		return answerOf(this.instanceRoot, reference);
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

	createNewRepeat(repeatNodeset: string): unknown {
		const event = this.getSelectedPositionalEvent();

		this.assertNodeset(event, repeatNodeset);

		const { node } = event;
		const { reference } = node.currentState;
		const repeatRange = getClosestRepeatRange(reference, node);

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
}
