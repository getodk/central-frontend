import type {
	NamedSubtreeDefinition,
	NamespaceDeclarationMap,
} from '../../lib/names/NamespaceDeclarationMap.ts';
import type { QualifiedName } from '../../lib/names/QualifiedName.ts';
import type { AnyBodyElementDefinition } from '../body/BodyDefinition.ts';
import type { RepeatElementDefinition } from '../body/RepeatElementDefinition.ts';
import type { BindDefinition } from './BindDefinition.ts';
import type { LeafNodeDefinition } from './LeafNodeDefinition.ts';
import type { RepeatInstanceDefinition } from './RepeatInstanceDefinition.ts';
import type { AnyRepeatRangeDefinition } from './RepeatRangeDefinition.ts';
import type { RepeatTemplateDefinition } from './RepeatTemplateDefinition.ts';
import type { RootDefinition } from './RootDefinition.ts';
import type { SubtreeDefinition } from './SubtreeDefinition.ts';

/**
 * Corresponds to the model/entry DOM root node, i.e.:
 *
 * - the element matching `/*` in primary instance expressions, a.k.a.
 * - `/h:html/h:head/xf:model/xf:instance[1]/*`
 */
export type RootNodeType = 'root';

/**
 * Corresponds to a range/sequence of model/entry DOM subtrees which in turn
 * corresponds to a <repeat> in the form body definition.
 */
export type RepeatRangeType = 'repeat-range';

/**
 * Corresponds to a template definition for a repeat range, which either has
 * an explicit `jr:template=""` attribute in the form definition or is inferred
 * as a template from the form's first element matched by a <repeat nodeset>.
 */
export type RepeatTemplateType = 'repeat-template';

/**
 * Corresponds to a single instance of a model/entry DOM subtree which
 * in turn corresponds to a <repeat> in the form body definition, and a
 * 'repeat-range' definition.
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
export type LeafNodeType = 'leaf-node';

// prettier-ignore
export type NodeDefinitionType =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| RootNodeType
	| RepeatRangeType
	| RepeatTemplateType
	| RepeatInstanceType
	| SubtreeNodeType
	| LeafNodeType;

// prettier-ignore
export type ParentNodeDefinition =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| RootDefinition
	| RepeatTemplateDefinition
	| RepeatInstanceDefinition
	| SubtreeDefinition;

// prettier-ignore
export type ChildNodeDefinition =
	| AnyRepeatRangeDefinition
	| LeafNodeDefinition
	| SubtreeDefinition;

// prettier-ignore
export type ChildNodeInstanceDefinition =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| RepeatTemplateDefinition
	| RepeatInstanceDefinition
	| SubtreeDefinition
	| LeafNodeDefinition;

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
	abstract readonly children: readonly ChildNodeDefinition[] | null;
	abstract readonly instances: readonly RepeatInstanceDefinition[] | null;
	abstract readonly defaultValue: string | null;

	/** @todo leaf-node may be Attr */
	abstract readonly node: Element | null;

	readonly nodeset: string;

	constructor(readonly bind: BindDefinition) {
		this.nodeset = bind.nodeset;
	}
}

export type AnyNodeDefinition =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| RootDefinition
	| AnyRepeatRangeDefinition
	| RepeatTemplateDefinition
	| RepeatInstanceDefinition
	| SubtreeDefinition
	| LeafNodeDefinition;
