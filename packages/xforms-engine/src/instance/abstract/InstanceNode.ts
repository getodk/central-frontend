import type { XPathNodeKindKey } from '@getodk/xpath';
import type { Accessor, Signal } from 'solid-js';
import type { BaseNode } from '../../client/BaseNode.ts';
import type { NodeAppearances } from '../../client/NodeAppearances.ts';
import type { FormNodeID } from '../../client/identity.ts';
import type { InstanceNodeType as ClientInstanceNodeType } from '../../client/node-types.ts';
import type { SubmissionState } from '../../client/submission/SubmissionState.ts';
import type { NodeValidationState } from '../../client/validation.ts';
import type { ActiveLanguage, TextRange } from '../../index.ts';
import type { EngineXPathEvaluator } from '../../integration/xpath/EngineXPathEvaluator.ts';
import type {
	XFormsXPathPrimaryInstanceNode,
	XFormsXPathPrimaryInstanceNodeKind,
} from '../../integration/xpath/adapter/XFormsXPathNode.ts';
import type { PrimaryInstanceXPathNode } from '../../integration/xpath/adapter/kind.ts';
import type { MaterializedChildren } from '../../lib/reactivity/materializeCurrentStateChildren.ts';
import type { CurrentState } from '../../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../../lib/reactivity/node-state/createEngineState.ts';
import type { SharedNodeState } from '../../lib/reactivity/node-state/createSharedNodeState.ts';
import type { ReactiveScope } from '../../lib/reactivity/scope.ts';
import { createReactiveScope } from '../../lib/reactivity/scope.ts';
import type { SimpleAtomicState } from '../../lib/reactivity/types.ts';
import type { AnyNodeDefinition } from '../../parse/model/NodeDefinition.ts';
import type { PrimaryInstance } from '../PrimaryInstance.ts';
import type { Root } from '../Root.ts';
import type { AnyChildNode, AnyNode, AnyParentNode } from '../hierarchy.ts';
import { nodeID } from '../identity.ts';
import type { EvaluationContext } from '../internal-api/EvaluationContext.ts';
import type { InstanceConfig } from '../internal-api/InstanceConfig.ts';

export type EngineInstanceNodeType = ClientInstanceNodeType | 'primary-instance';

export interface BaseEngineNode extends Omit<BaseNode, 'nodeType'> {
	readonly nodeType: EngineInstanceNodeType;
}

// prettier-ignore
export type InstanceNodeValueOptionsStateSpec =
	| Accessor<null>
	| Accessor<readonly unknown[]>
	| null

export interface InstanceNodeStateSpec<Value = never> {
	readonly reference: Accessor<string> | string;
	readonly readonly: Accessor<boolean> | boolean;
	readonly relevant: Accessor<boolean> | boolean;
	readonly required: Accessor<boolean> | boolean;
	readonly label: Accessor<TextRange<'label'> | null> | null;
	readonly hint: Accessor<TextRange<'hint'> | null> | null;
	readonly children: Accessor<readonly FormNodeID[]> | null;
	readonly valueOptions: InstanceNodeValueOptionsStateSpec;
	readonly value: Signal<Value> | SimpleAtomicState<Value> | null;
}

type AnyInstanceNode = InstanceNode<
	AnyNodeDefinition,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	InstanceNodeStateSpec<any>,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	any
>;

/**
 * This type has the same effect as {@link MaterializedChildren}, but abstractly
 * handles leaf node types as well.
 */
// prettier-ignore
export type InstanceNodeCurrentState<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	Spec extends InstanceNodeStateSpec<any>,
	Child
> =
	& CurrentState<Omit<Spec, 'children'>>
	& {
			readonly children: [Child] extends [AnyChildNode]
				? readonly Child[]
				: null;
		};

interface ComputableReferenceNode {
	readonly parent: AnyParentNode | null;
	readonly definition: AnyNodeDefinition;
}

type ComputeInstanceNodeReference = <This extends ComputableReferenceNode>(
	this: This,
	parent: This['parent'],
	definition: This['definition']
) => string;

export interface InstanceNodeOptions {
	readonly computeReference?: () => string;
	readonly scope?: ReactiveScope;
}

export abstract class InstanceNode<
		Definition extends AnyNodeDefinition,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		Spec extends InstanceNodeStateSpec<any>,
		Parent extends AnyParentNode | null,
		Child extends AnyChildNode | null = null,
	>
	implements BaseEngineNode, XFormsXPathPrimaryInstanceNode, EvaluationContext
{
	protected abstract readonly state: SharedNodeState<Spec>;
	protected abstract readonly engineState: EngineState<Spec>;

	// XFormsXPathPrimaryInstanceNode
	abstract readonly [XPathNodeKindKey]: XFormsXPathPrimaryInstanceNodeKind;
	readonly rootDocument: PrimaryInstance;
	abstract readonly root: Root;

	/**
	 * @package Exposed on every node type to facilitate inheritance, as well as
	 * conditional behavior for value nodes.
	 */
	abstract readonly hasReadonlyAncestor: Accessor<boolean>;

	/**
	 * @package Exposed on every node type to facilitate inheritance, as well as
	 * conditional behavior for value nodes.
	 */
	abstract readonly isReadonly: Accessor<boolean>;

	/**
	 * @package Exposed on every node type to facilitate inheritance, as well as
	 * conditional behavior for value nodes.
	 */
	abstract readonly hasNonRelevantAncestor: Accessor<boolean>;

	/**
	 * @package Exposed on every node type to facilitate inheritance, as well as
	 * conditional behavior for value nodes.
	 */
	abstract readonly isRelevant: Accessor<boolean>;

	// BaseNode: identity
	readonly nodeId: FormNodeID;

	// BaseNode: node types and variants (e.g. for narrowing)
	abstract readonly nodeType: EngineInstanceNodeType;

	abstract readonly appearances: NodeAppearances<Definition>;

	abstract readonly currentState: InstanceNodeCurrentState<Spec, Child>;

	abstract readonly validationState: NodeValidationState;

	abstract readonly submissionState: SubmissionState;

	// EvaluationContext: instance-global/shared
	abstract readonly evaluator: EngineXPathEvaluator;
	abstract readonly getActiveLanguage: Accessor<ActiveLanguage>;

	// EvaluationContext: node-specific
	abstract readonly isAttached: Accessor<boolean>;
	readonly scope: ReactiveScope;
	readonly computeReference: ComputeInstanceNodeReference;

	protected readonly computeChildStepReference: ComputeInstanceNodeReference = (
		parent,
		definition
	): string => {
		if (parent == null) {
			throw new Error(
				'Cannot compute child step reference of node without parent (was this called from `Root`?)'
			);
		}

		return `${parent.contextReference()}/${definition.localName}`;
	};

	// EvaluationContext: node-specific
	readonly contextReference = (): string => {
		return this.computeReference(this.parent, this.definition);
	};

	/**
	 * Note: it is expected that at least some node subclasses will override this
	 * to reflect (or in the case of intermediate abstract base classes, to
	 * constrain) their more specific `this` type.
	 */
	readonly contextNode: PrimaryInstanceXPathNode =
		this as AnyInstanceNode as PrimaryInstanceXPathNode;

	constructor(
		readonly engineConfig: InstanceConfig,
		readonly parent: Parent,
		readonly definition: Definition,
		options?: InstanceNodeOptions
	) {
		const self = this as AnyInstanceNode as AnyNode;

		if (parent == null) {
			if (!self.isPrimaryInstance()) {
				throw new Error(
					'Failed to construct node: not a primary instance, no parent node specified'
				);
			}

			this.rootDocument = self;
		} else {
			this.rootDocument = parent.rootDocument;
		}

		this.computeReference = options?.computeReference ?? this.computeChildStepReference;

		this.scope = options?.scope ?? createReactiveScope();
		this.engineConfig = engineConfig;
		this.nodeId = nodeID(engineConfig.createUniqueId());
		this.definition = definition;
	}

	/** @package */
	isPrimaryInstance(): this is PrimaryInstance {
		return this.parent == null;
	}

	/** @package */
	isRoot(): this is Root {
		return this.parent?.nodeType === 'primary-instance';
	}

	/**
	 * @package This presently serves a growing variety of internal use cases,
	 * where certain behaviors depend on arbitrary traversal from any point in the
	 * instance tree, without particular regard for the visited node type. It
	 * isn't intended for external traversal or any other means of consuming
	 * children by a client. This return type intentionally deviates from one
	 * structural expectation, requiring even leaf nodes to return an array
	 * (though for those nodes it will always be empty). This affords consistency
	 * and efficiency of interface for those internal uses.
	 */
	abstract getChildren(this: AnyInstanceNode): readonly AnyChildNode[];

	// XFormsXPathNode
	/**
	 * @todo Values as text nodes(?)
	 */
	getXPathChildNodes(): readonly AnyChildNode[] {
		return (this as AnyInstanceNode).getChildren().flatMap((child) => {
			switch (child.nodeType) {
				case 'repeat-range:controlled':
				case 'repeat-range:uncontrolled': {
					const repeatInstances = child.getXPathChildNodes();

					if (repeatInstances.length > 0) {
						return repeatInstances;
					}

					return child;
				}

				default:
					return child;
			}
		});
	}

	getXPathValue(): string {
		return (this as AnyInstanceNode as AnyNode)
			.getXPathChildNodes()
			.map((child) => child.getXPathValue())
			.join('');
	}
}
