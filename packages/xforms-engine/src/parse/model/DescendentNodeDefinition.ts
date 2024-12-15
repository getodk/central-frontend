import type { AnyBodyElementDefinition } from '../body/BodyDefinition.ts';
import type { BindDefinition } from './BindDefinition.ts';
import type { NodeDefinitionType, ParentNodeDefinition } from './NodeDefinition.ts';
import { NodeDefinition } from './NodeDefinition.ts';
import type { RootDefinition } from './RootDefinition.ts';

export type DescendentNodeType = Exclude<NodeDefinitionType, 'root'>;

type DescendentNodeBodyElement = AnyBodyElementDefinition;

export abstract class DescendentNodeDefinition<
	Type extends DescendentNodeType,
	BodyElement extends DescendentNodeBodyElement | null = DescendentNodeBodyElement | null,
> extends NodeDefinition<Type> {
	readonly root: RootDefinition;
	readonly isTranslated: boolean = false;

	constructor(
		readonly parent: ParentNodeDefinition,
		bind: BindDefinition,
		readonly bodyElement: BodyElement
	) {
		super(bind);

		this.root = parent.root;

		if (bind.isTranslated || bodyElement?.isTranslated) {
			this.isTranslated = true;
		}
	}
}
