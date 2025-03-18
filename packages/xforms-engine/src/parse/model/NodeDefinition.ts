import type { StaticElement } from '../../integration/xpath/static-dom/StaticElement.ts';
import type {
	NamedSubtreeDefinition,
	NamespaceDeclarationMap,
} from '../../lib/names/NamespaceDeclarationMap.ts';
import type { QualifiedName } from '../../lib/names/QualifiedName.ts';
import type { AnyBodyElementDefinition } from '../body/BodyDefinition.ts';
import type { RepeatElementDefinition } from '../body/RepeatElementDefinition.ts';
import type { BindDefinition } from './BindDefinition.ts';
import type { LeafNodeDefinition } from './LeafNodeDefinition.ts';
import type { AnyRepeatDefinition } from './RepeatDefinition.ts';
import type { RootDefinition } from './RootDefinition.ts';
import type { SubtreeDefinition } from './SubtreeDefinition.ts';

/**
 * Corresponds to a model instance root node, i.e.:
 *
 * - the element matching `/*` in primary instance expressions, a.k.a.
 * - `/h:html/h:head/xf:model/xf:instance[1]/*`
 */
export type RootNodeType = 'root';

/**
 * Corresponds to the combined concepts defining a "repeat".
 *
 * @see {@link RepeatDefinition} for details on these concepts and how they are used to produce a "repeat definition", as such.
 *
 * , including or
 * referencing all of the following:
 *
 */
export type RepeatType = 'repeat';

/**
 * Corresponds to a model instance subtree which **does not** correspond to a
 * <repeat> in the form definition. This will typically correspond to a <group>,
 * but this is not strictly necessary per spec (hence the distinct name).
 */
export type SubtreeNodeType = 'subtree';

/**
 * Corresponds to a model instance leaf node, i.e. one of:
 *
 * - An element with no child elements
 * - Any attribute corresponding to a bind's `nodeset` expression
 */
export type LeafNodeType = 'leaf-node';

// prettier-ignore
export type NodeDefinitionType =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| RootNodeType
	| RepeatType
	| SubtreeNodeType
	| LeafNodeType;

// prettier-ignore
export type ParentNodeDefinition =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| RootDefinition
	| AnyRepeatDefinition
	| SubtreeDefinition;

// prettier-ignore
export type ChildNodeDefinition =
	| AnyRepeatDefinition
	| LeafNodeDefinition
	| SubtreeDefinition;

export abstract class NodeDefinition<Type extends NodeDefinitionType>
	implements NamedSubtreeDefinition
{
	abstract readonly type: Type;
	abstract readonly namespaceDeclarations: NamespaceDeclarationMap;
	abstract readonly qualifiedName: QualifiedName;
	abstract readonly bodyElement: AnyBodyElementDefinition | RepeatElementDefinition | null;
	abstract readonly isTranslated: boolean;
	abstract readonly root: RootDefinition;
	abstract readonly parent: ParentNodeDefinition | null;
	abstract readonly template: StaticElement;
	abstract readonly children: readonly ChildNodeDefinition[] | null;

	readonly nodeset: string;

	constructor(readonly bind: BindDefinition) {
		this.nodeset = bind.nodeset;
	}
}

// prettier-ignore
export type AnyNodeDefinition =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| RootDefinition
	| AnyRepeatDefinition
	| SubtreeDefinition
	| LeafNodeDefinition;
