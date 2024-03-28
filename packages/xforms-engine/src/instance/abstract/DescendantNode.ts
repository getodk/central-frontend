import type { XFormsXPathEvaluator } from '@odk-web-forms/xpath';
import type { Accessor } from 'solid-js';
import { createMemo } from 'solid-js';
import type { BaseNode } from '../../client/BaseNode.ts';
import type { TextRange } from '../../client/TextRange.ts';
import type { BindComputation } from '../../model/BindComputation.ts';
import type { AnyDescendantNodeDefinition } from '../../model/DescendentNodeDefinition.ts';
import type { AnyNodeDefinition } from '../../model/NodeDefinition.ts';
import type { RepeatInstanceDefinition } from '../../model/RepeatInstanceDefinition.ts';
import type { ValueNodeDefinition } from '../../model/ValueNodeDefinition.ts';
import type { RepeatRange } from '../RepeatRange.ts';
import type { Root } from '../Root.ts';
import type { AnyChildNode, GeneralParentNode } from '../hierarchy.ts';
import type { EvaluationContext } from '../internal-api/EvaluationContext.ts';
import type { SubscribableDependency } from '../internal-api/SubscribableDependency.ts';
import type { InstanceNodeState, InstanceNodeStateSpec } from './InstanceNode.ts';
import { InstanceNode } from './InstanceNode.ts';

interface DescendantNodeSharedState {
	get reference(): string;
	get readonly(): boolean;
	get relevant(): boolean;
	get required(): boolean;
}

export interface DescendantNodeSharedStateSpec {
	readonly reference: Accessor<string>;
	readonly readonly: Accessor<boolean>;
	readonly relevant: Accessor<boolean>;
	readonly required: Accessor<boolean>;
}

// prettier-ignore
export type DescendantNodeStateSpec<Value = never> =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	& InstanceNodeStateSpec<Value>
	& DescendantNodeSharedStateSpec;

export interface DescendantNodeState extends DescendantNodeSharedState, InstanceNodeState {
	get label(): TextRange<'label'> | null;
	get hint(): TextRange<'hint'> | null;
	get children(): readonly AnyChildNode[] | null;
	get valueOptions(): unknown;
	get value(): unknown;
}

// prettier-ignore
export type DescendantNodeDefinition = Extract<
	AnyNodeDefinition,
	AnyDescendantNodeDefinition
>;

// prettier-ignore
export type DescendantNodeParent<Definition extends DescendantNodeDefinition> =
	Definition extends ValueNodeDefinition
		? GeneralParentNode
	: Definition extends RepeatInstanceDefinition
		? RepeatRange
		: GeneralParentNode;

export abstract class DescendantNode<
		Definition extends DescendantNodeDefinition,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		Spec extends DescendantNodeStateSpec<any>,
	>
	extends InstanceNode<Definition, Spec>
	implements BaseNode, EvaluationContext, SubscribableDependency
{
	readonly root: Root;
	readonly evaluator: XFormsXPathEvaluator;
	readonly contextNode: Element;

	constructor(
		override readonly parent: DescendantNodeParent<Definition>,
		override readonly definition: Definition
	) {
		super(parent.engineConfig, definition);

		const { evaluator, root } = parent;

		this.root = root;
		this.evaluator = evaluator;
		this.contextNode = this.initializeContextNode(parent.contextNode, definition.nodeName);
	}

	protected computeChildStepReference(parent: DescendantNodeParent<Definition>): string {
		return `${parent.contextReference}/${this.definition.nodeName}`;
	}

	protected abstract computeReference(parent: DescendantNodeParent<Definition>): string;

	protected buildSharedStateSpec(
		parent: DescendantNodeParent<Definition>,
		definition: Definition
	): DescendantNodeSharedStateSpec {
		return this.scope.runTask(() => {
			const reference = createMemo(() => this.computeReference(parent));

			const { bind } = definition;

			// Temporary, will be made reactive in subsequent commit
			type BooleanBindComputationType = 'readonly' | 'relevant' | 'required';
			const booleanEvaluation = (
				computation: BindComputation<BooleanBindComputationType>
			): Accessor<boolean> => {
				return () =>
					this.evaluator.evaluateBoolean(computation.expression, {
						contextNode: this.contextNode,
					});
			};
			const readonly = booleanEvaluation(bind.readonly);
			const relevant = booleanEvaluation(bind.relevant);
			const required = booleanEvaluation(bind.required);

			return {
				reference,
				readonly,
				relevant,
				required,
			};
		});
	}

	/**
	 * Currently expected to be overridden by repeat range.
	 */
	protected initializeContextNode(parentContextNode: Element, nodeName: string): Element {
		const { ownerDocument } = parentContextNode;
		const element = ownerDocument.createElement(nodeName);

		parentContextNode.append(element);

		return element;
	}

	getSubscribableDependencyByReference(_reference: string): SubscribableDependency | null {
		throw new Error('Not implemented');
	}

	subscribe(): void {
		throw new Error('Not implemented');
	}

	/**
	 * To be called when:
	 *
	 * - the node itself is removed
	 * - a parent/ancestor has been removed(?)
	 *
	 * Implies, at least, a call to `this.scope.dispose()`; possibly make an
	 * exception for repeat instances, which we might want to retain in case
	 * they're re-added. This came up as a behavior of Collect/JavaRosa, and we
	 * should investigate the details and ramifications of that, and whether it's
	 * the desired behavior.
	 */
	remove(): void {
		throw new Error('Not implemented');
	}
}
