import type { Accessor } from 'solid-js';
import { createComputed, createMemo, createSignal, on } from 'solid-js';
import { createUninitializedAccessor } from '../../reactivity/primitives/uninitialized.ts';
import type { DependentExpression } from '../expression/DependentExpression.ts';
import type { BindComputation } from '../model/BindComputation.ts';
import type { EntryState } from './EntryState.ts';
import type {
	AnyNodeState,
	ChildStates,
	NodeState,
	NodeStateType,
	ParentState,
	StateModelDefinition,
	StateNode,
	ValueSignal,
} from './NodeState.ts';
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- referenced in JSDoc
import type { ValueNodeState } from './ValueNodeState.ts';

type BooleanBindComputationType =
	| 'constraint'
	| 'readonly'
	| 'relevant'
	| 'required'
	| 'saveIncomplete';

type DescendantNodeStateType = Exclude<NodeStateType, 'root'>;

export abstract class DescendantNodeState<Type extends DescendantNodeStateType>
	implements NodeState<Type>
{
	readonly nodeset: string;

	abstract readonly node: StateNode<Type>;

	protected referenceMemo: Accessor<string> | null = null;

	get reference(): string {
		let { referenceMemo } = this;

		if (referenceMemo == null) {
			const { nodeName } = this.definition;

			referenceMemo = createMemo(() => {
				return `${this.parent.reference}/${nodeName}`;
			});
			this.referenceMemo = referenceMemo;
		}

		return referenceMemo();
	}

	readonly isReferenceStatic: boolean;

	// TODO: constraint, saveIncomplete(?)

	calculate: Accessor<string> | null;
	isReadonly: Accessor<boolean>;
	isRelevant: Accessor<boolean>;
	isRequired: Accessor<boolean>;

	abstract readonly valueState: ValueSignal<Type>;

	abstract readonly children: ChildStates<Type>;

	constructor(
		readonly entry: EntryState,
		readonly parent: ParentState<Type>,
		readonly type: Type,
		readonly definition: StateModelDefinition<Type>
	) {
		this.nodeset = definition.bind.nodeset;
		this.isReferenceStatic = parent.isReferenceStatic && type !== 'repeat-instance';
		this.calculate = createUninitializedAccessor<string>();
		this.isReadonly = createUninitializedAccessor<boolean>();
		this.isRelevant = createUninitializedAccessor<boolean>();
		this.isRequired = createUninitializedAccessor<boolean>();
	}

	isStateInitialized = false;

	initializeState(): void {
		if (this.isStateInitialized) {
			return;
		}

		const { definition, parent } = this;
		const { bind } = definition;
		const isSelfReadonly = this.createBooleanBindComputation(bind.readonly);
		const isSelfRelevant = this.createBooleanBindComputation(bind.relevant);

		this.calculate = this.createCalculate(bind.calculate);
		this.isReadonly = createMemo(() => parent.isReadonly() || isSelfReadonly());
		this.isRelevant = createMemo(() => parent.isRelevant() && isSelfRelevant());
		this.isRequired = this.createBooleanBindComputation(bind.required);
		this.isStateInitialized = true;
	}

	getValue(this: DescendantNodeState<'value-node'>): string;
	getValue(): null;
	getValue(): string | null {
		if (this.valueState == null) {
			return null;
		}

		const [value] = this.valueState;

		return value();
	}

	// TODO: super naive, just meant to communicate a starting point/direction.
	protected contextualizeDependencyExpression(expression: string): string {
		let current: AnyNodeState | null = this.parent;

		while (current != null) {
			const { nodeset } = current;

			if (expression === nodeset) {
				return current.reference;
			}

			const prefix = `${nodeset}/`;

			if (expression.startsWith(prefix)) {
				return expression.replace(prefix, `${current.reference}/`);
			}

			current = current.parent;
		}

		return expression;
	}

	// TODO: actually do something with this at all
	protected contextualizeComputationExpression(expression: string): string {
		return expression;
	}

	protected createEvaluation<T>(
		dependentExpression: DependentExpression,
		evaluateExpression: () => T
	): Accessor<T> {
		const { entry } = this;
		const { dependencyReferences } = dependentExpression;

		if (dependencyReferences.size === 0 && this.isReferenceStatic) {
			return evaluateExpression;
		}

		const [isEvaluationStale, setIsEvaluationStale] = createSignal(false);
		const triggerStaleReevaluation = () => {
			setIsEvaluationStale(true);
		};

		interface DependencyState {
			readonly reference: string;
			readonly isRelevant: boolean;
			readonly value: string | null;
		}

		const isDependencyEqual = (previous: DependencyState, current: DependencyState): boolean => {
			return (
				previous.reference === current.reference &&
				previous.isRelevant === current.isRelevant &&
				previous.value === current.value
			);
		};

		const dependencies = Array.from(dependencyReferences).map(
			(dependencyExpression): Accessor<DependencyState> => {
				return createMemo(
					() => {
						const reference = this.contextualizeDependencyExpression(dependencyExpression);
						const state = entry.getState(reference);

						if (state == null) {
							console.error('No state for dependency', reference);
						}

						if (state == null || state.type === 'root') {
							return {
								reference: reference,
								isRelevant: true,
								value: null,
							};
						}

						return {
							reference: state.reference,
							isRelevant: state.isRelevant(),
							value: state.getValue(),
						};
					},
					{ equals: isDependencyEqual }
				);
			}
		);

		createComputed(on(dependencies, triggerStaleReevaluation, { defer: true }));

		// TODO: super naive, assumes that a reference change (e.g. a repeat
		// position change) warrants recomputation. A less naive solution would
		// determine if the expression would be impacted by the expression change.
		createComputed((previousReference) => {
			const currentReference = this.reference;

			if (currentReference !== previousReference) {
				triggerStaleReevaluation();
			}

			return currentReference;
		}, this.reference);

		const evaluate = createMemo<T>((evaluated) => {
			if (isEvaluationStale()) {
				return evaluateExpression();
			}

			return evaluated;
		}, evaluateExpression());

		const completeStaleReevaluation = () => {
			setIsEvaluationStale(false);
		};

		createComputed(on(isEvaluationStale, completeStaleReevaluation, { defer: true }));

		return evaluate;
	}

	/**
	 * Creates a reactive getter which produces the evaluated result for the
	 * provided {@link BindComputation} on initialization, and whenever the state
	 * (runtime or DOM, @see {@link ValueNodeState.createValueNodeState}) of any
	 * of its dependencies is updated.
	 */
	protected createBooleanBindComputation<
		Computation extends BindComputation<BooleanBindComputationType>,
	>(bindComputation: Computation): Accessor<boolean> {
		const { entry, node: contextNode } = this;
		const { evaluator } = entry;
		const { expression } = bindComputation;
		const evaluateExpression = () => evaluator.evaluateBoolean(expression, { contextNode });

		return this.createEvaluation(bindComputation, evaluateExpression);
	}

	protected createCalculate(
		computation: BindComputation<'calculate'> | null
	): Accessor<string> | null {
		if (computation == null) {
			return null;
		}

		const { entry, node: contextNode } = this;
		const { evaluator } = entry;

		const evaluateExpression = () =>
			evaluator.evaluateString(computation.expression, { contextNode });

		return this.createEvaluation(computation, evaluateExpression);
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyDescandantNodeState = Extract<AnyNodeState, DescendantNodeState<any>>;
