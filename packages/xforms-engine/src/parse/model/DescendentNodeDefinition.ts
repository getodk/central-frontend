import type { AnyBodyElementDefinition } from '../body/BodyDefinition.ts';
import type { BindDefinition } from './BindDefinition.ts';
import type {
	ModelNode,
	NodeChildren,
	NodeDefaultValue,
	NodeDefinition,
	NodeDefinitionType,
	NodeInstances,
	NodeParent,
} from './NodeDefinition.ts';
import type { RootDefinition } from './RootDefinition.ts';

export type DescendentNodeType = Exclude<NodeDefinitionType, 'root'>;

type DescendentNodeBodyElement = AnyBodyElementDefinition;

export abstract class DescendentNodeDefinition<
	Type extends DescendentNodeType,
	BodyElement extends DescendentNodeBodyElement | null = DescendentNodeBodyElement | null,
> implements NodeDefinition<Type>
{
	abstract readonly type: Type;
	abstract readonly children: NodeChildren<Type>;
	abstract readonly instances: NodeInstances<Type>;
	abstract readonly defaultValue: NodeDefaultValue<Type>;
	abstract readonly node: ModelNode<Type>;
	abstract readonly nodeName: string;

	readonly root: RootDefinition;
	readonly nodeset: string;
	readonly dependencyExpressions: ReadonlySet<string>;
	readonly isTranslated: boolean = false;

	constructor(
		readonly parent: NodeParent<Type>,
		readonly bind: BindDefinition,
		readonly bodyElement: BodyElement
	) {
		this.root = parent.root;
		this.nodeset = bind.nodeset;

		if (bind.isTranslated || bodyElement?.isTranslated) {
			this.isTranslated = true;
		}

		this.dependencyExpressions = new Set([
			...bind.dependencyExpressions,
			...(bodyElement?.dependencyExpressions ?? []),
		]);
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyDescendantNodeDefinition = DescendentNodeDefinition<any, any>;
