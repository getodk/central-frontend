import type { AnyBodyElementDefinition } from '../body/BodyDefinition.ts';
import type { RepeatDefinition } from '../body/RepeatDefinition.ts';
import type { BindDefinition } from './BindDefinition.ts';
import type { RepeatInstanceDefinition } from './RepeatInstanceDefinition.ts';
import type { RepeatSequenceDefinition } from './RepeatSequenceDefinition.ts';
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
 * corresponds to a <repeat> in the form definition.
 */

export type RepeatSequenceType = 'repeat-sequence';
/**
 * Corresponds to a single instance of a model/entry DOM subtree which
 * in turn corresponds to a <repeat> in the form definition, and a
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
	| RepeatInstanceType
	| SubtreeNodeType
	| ValueNodeType;

// prettier-ignore
export type ParentNodeDefinition =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| RootDefinition
	| RepeatInstanceDefinition
	| SubtreeNodeDefinition;

// prettier-ignore
export type ChildNodeDefinition =
	| RepeatSequenceDefinition
	| SubtreeNodeDefinition
	| ValueNodeDefinition;

// prettier-ignore
export type ChildNodeInstanceDefinition =
	| RepeatInstanceDefinition
	| SubtreeNodeDefinition
	| ValueNodeDefinition;

type NodeChildren<Type extends NodeDefinitionType> = Type extends ParentNodeDefinition['type']
	? readonly ChildNodeDefinition[]
	: null;

type NodeParent<Type extends NodeDefinitionType> = Type extends ChildNodeInstanceDefinition['type']
	? ParentNodeDefinition
	: null;

export interface LeafElement extends Element {
	readonly children: Element['children'] & { readonly length: 0 };
}

export interface NodeDefinition<Type extends NodeDefinitionType> {
	readonly type: Type;

	readonly bind: BindDefinition;
	readonly bodyElement: AnyBodyElementDefinition | RepeatDefinition | null;

	readonly root: RootDefinition;
	readonly parent: NodeParent<Type>;
	readonly children: NodeChildren<Type>;

	// TODO: value-node may be Attr
	readonly node: Element;
}
