import type { Accessor } from 'solid-js';
import { createEffect, createMemo, createResource, getOwner, runWithOwner } from 'solid-js';
import type {
	BindDefinition,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars -- referenced in JSDoc
	BindExpression,
	BindExpressionType,
} from '../model/BindDefinition.ts';
import type { EntryState } from './EntryState.ts';
import type {
	ChildStates,
	NodeState,
	NodeStateType,
	ParentState,
	StateModelDefinition,
	StateNode,
	ValueSignal,
} from './NodeState.ts';

const defaultEvaluationResults = {
	calculate: null as string | null,
	constraint: true as boolean,
	readonly: false as boolean,
	relevant: true as boolean,
	required: false as boolean,
	saveIncomplete: false as boolean,
} as const;

type AnyBindExpression = BindDefinition[BindExpressionType];

type EvaluationResult<Expression extends AnyBindExpression> = ReturnType<Expression['evaluate']>;

type DescendantNodeStateType = Exclude<NodeStateType, 'root'>;

export abstract class DescendantNodeState<Type extends DescendantNodeStateType>
	implements NodeState<Type>
{
	abstract readonly node: StateNode<Type>;
	abstract readonly children: ChildStates<Type>;

	abstract readonly valueState: ValueSignal<Type>;

	readonly calculate: Accessor<string> | null;
	readonly isReadonly: Accessor<boolean>;
	readonly isRelevant: Accessor<boolean>;
	readonly isRequired: Accessor<boolean>;

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

	constructor(
		readonly entry: EntryState,
		readonly parent: ParentState<Type>,
		readonly type: Type,
		readonly definition: StateModelDefinition<Type>
	) {
		const { bind } = definition;

		this.calculate = this.createOptionalBindExpressionEvaluation(bind.calculate);

		const isSelfReadonly = this.createBindExpressionEvaluation(bind.readonly);

		this.isReadonly = createMemo(() => {
			return this.parent?.isReadonly() || isSelfReadonly();
		});

		const isSelfRelevant = this.createBindExpressionEvaluation(bind.relevant);

		this.isRelevant = createMemo(() => {
			const ancestor = this.parent;

			if (ancestor != null && !ancestor.isRelevant()) {
				return false;
			}

			return isSelfRelevant();
		});

		this.isRequired = this.createBindExpressionEvaluation(bind.required);
	}

	/**
	 * Creates a reactive getter which produces the evaluated result for the
	 * provided {@link BindExpression} on initialization, and whenever the state
	 * (runtime or DOM, @see {@link createModelState}) of any of its dependencies
	 * is updated.
	 */
	createBindExpressionEvaluation<Expression extends AnyBindExpression>(
		bindExpression: Expression
	): Accessor<EvaluationResult<Expression>> {
		const { expression, expressionType } = bindExpression;

		if (expression == null) {
			const defaultResult = defaultEvaluationResults[
				expressionType
			] as EvaluationResult<Expression>;

			return () => defaultResult;
		}

		const { evaluator } = this.entry;
		const evaluate = () => bindExpression.evaluate(evaluator, this.node);

		const [evaluation, { refetch }] = createResource(evaluate, {
			initialValue: evaluate(),
		});

		// TODO (RE everything below...):
		//
		// - The business with owner and microtask are a lucky (temporary)
		//   workaround for the fact that the top-down tree construction approach is
		//   presently ignoring dependency order.
		// - It's possible this is also why `createEffect` is needed, where it had
		//   been `createComputed` in a previous iteration (and which it should
		//   still be, at least so long as there's an explicit state reaction ->
		//   state update chain).
		// - This (or somewhere related) would probably be an excellent candidate
		//   for contextualizing repeat-sensitive dependency expressions. For
		//   instance, currently repeats will produce error logs like "No state for
		//   dependency /root/rep". Which makes sense, as the dependency should
		//   actually be `/root/rep[1]` and so on.
		// - "value" is only one aspect of reactive dependency to establish here.
		//   It's actually surprising that this hasn't broken inheritance of
		//   readonly/relevant (or more specifically, it's probably introduced
		//   subtle bugs which aren't well tested yet).
		const owner = getOwner();

		queueMicrotask(() => {
			runWithOwner(owner, () => {
				const dependencyAccessors = createMemo(() => {
					return bindExpression.dependencyExpressions.flatMap((dependencyExpression) => {
						const state = this.entry.getState(dependencyExpression);

						if (state == null) {
							console.error('No state for dependency', dependencyExpression);

							return [];
						}

						if (state.type !== 'value-node') {
							return [];
						}

						const [value] = state.valueState;

						return {
							state,
							value,
						};
					});
				});
				const dependencies = () => {
					dependencyAccessors().forEach((dependency) => {
						const { value } = dependency;

						value();
					});
				};

				createEffect(() => {
					dependencies();
					void refetch();
				});
			});
		});

		return evaluation as Accessor<EvaluationResult<Expression>>;
	}

	createOptionalBindExpressionEvaluation<Expression extends AnyBindExpression>(
		bindExpression: Expression
	): Accessor<EvaluationResult<Expression>> | null {
		if (bindExpression.expression == null) {
			return null;
		}

		return this.createBindExpressionEvaluation(bindExpression);
	}
}
