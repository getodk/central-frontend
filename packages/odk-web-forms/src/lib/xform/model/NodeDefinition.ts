import type { AnyBodyElementDefinition } from '../body/BodyDefinition.ts';
import type { RepeatDefinition } from '../body/RepeatDefinition.ts';
import type { BindDefinition } from './BindDefinition.ts';
import type { RepeatInstanceDefinition } from './RepeatInstanceDefinition.ts';
import type { RepeatSequenceDefinition } from './RepeatSequenceDefinition.ts';
import type { RepeatTemplateDefinition } from './RepeatTemplateDefinition.ts';
import type { RootDefinition } from './RootDefinition.ts';
import type { SubtreeNodeDefinition } from './SubtreeDefinition.ts';
import type { ValueNodeDefinition } from './ValueNodeDefinition.ts';

/**
 * Corresponds to the model/entry DOM root node, i.e.:
 *
 * - the element matching `/*` in primary instance expressions, a.k.a.
 * - `/h:html/h:head/xf:model/xf:instance[1]/*`
 */
export type RootNodeType = 'root';

/**
 * Corresponds to a sequence of model/entry DOM subtrees which in turn
 * corresponds to a <repeat> in the form body definition.
 */
export type RepeatSequenceType = 'repeat-sequence';

/**
 * Corresponds to a template definition for a repeat sequence, which either has
 * an explicit `jr:template=""` attribute in the form definition or is inferred
 * as a template from the form's first element matched by a <repeat nodeset>.
 */
export type RepeatTemplateType = 'repeat-template';

/**
 * Corresponds to a single instance of a model/entry DOM subtree which
 * in turn corresponds to a <repeat> in the form body definition, and a
 * 'repeat-sequence' definition.
 */
export type RepeatInstanceType = 'repeat-instance';

/**
 * Corresponds to a model/entry DOM subtree which **does not** correspond to a
 * <repeat> in the form definition. This will typically correspond to a <group>,
 * but this is not strictly necessary per spec (hence the distinct name).
 */
export type SubtreeNodeType = 'subtree';

/**
 * Corresponds to a model/entry DOM leaf node, i.e. one of:
 *
 * - An element with no child elements
 * - Any attribute corresponding to a bind's `nodeset` expression
 */
export type ValueNodeType = 'value-node';

// prettier-ignore
export type NodeDefinitionType =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| RootNodeType
	| RepeatSequenceType
	| RepeatTemplateType
	| RepeatInstanceType
	| SubtreeNodeType
	| ValueNodeType;

// prettier-ignore
export type ParentNodeDefinition =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| RootDefinition
	| RepeatTemplateDefinition
	| RepeatInstanceDefinition
	| SubtreeNodeDefinition;

// prettier-ignore
export type ChildNodeDefinition =
	| RepeatSequenceDefinition
	| SubtreeNodeDefinition
	| ValueNodeDefinition;

// prettier-ignore
export type ChildNodeInstanceDefinition =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| RepeatTemplateDefinition
	| RepeatInstanceDefinition
	| SubtreeNodeDefinition
	| ValueNodeDefinition;

// prettier-ignore
type NodeChildren<Type extends NodeDefinitionType> =
	Type extends ParentNodeDefinition['type']
		? readonly ChildNodeDefinition[]
		: null;

// prettier-ignore
type NodeInstances<Type extends NodeDefinitionType> =
	Type extends 'repeat-sequence'
		? readonly RepeatInstanceDefinition[]
		: null;

// prettier-ignore
type NodeParent<Type extends NodeDefinitionType> =
	Type extends ChildNodeDefinition['type'] | ChildNodeInstanceDefinition['type']
		? ParentNodeDefinition
		: null;

type DefinitionNode<Type extends NodeDefinitionType> = Type extends 'repeat-sequence'
	? null
	: Element;

export interface NodeDefinition<Type extends NodeDefinitionType> {
	readonly type: Type;

	readonly bind: BindDefinition;
	readonly bodyElement: AnyBodyElementDefinition | RepeatDefinition | null;

	readonly root: RootDefinition;
	readonly parent: NodeParent<Type>;
	readonly children: NodeChildren<Type>;
	readonly instances: NodeInstances<Type>;

	// TODO: value-node may be Attr
	readonly node: DefinitionNode<Type>;
}
