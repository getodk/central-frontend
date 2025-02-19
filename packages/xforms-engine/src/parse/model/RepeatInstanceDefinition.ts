import { NamespaceDeclarationMap } from '../../lib/names/NamespaceDeclarationMap.ts';
import { QualifiedName } from '../../lib/names/QualifiedName.ts';
import { RepeatElementDefinition } from '../body/RepeatElementDefinition.ts';
import { DescendentNodeDefinition } from './DescendentNodeDefinition.ts';
import type { ChildNodeDefinition } from './NodeDefinition.ts';
import type { AnyRepeatRangeDefinition } from './RepeatRangeDefinition.ts';

export class RepeatInstanceDefinition extends DescendentNodeDefinition<
	'repeat-instance',
	RepeatElementDefinition
> {
	readonly type = 'repeat-instance';

	readonly namespaceDeclarations: NamespaceDeclarationMap;
	readonly qualifiedName: QualifiedName;
	readonly children: readonly ChildNodeDefinition[];
	readonly instances = null;
	readonly defaultValue = null;

	constructor(
		range: AnyRepeatRangeDefinition,
		readonly node: Element
	) {
		const { bind, bodyElement, parent, root } = range;

		super(parent, bind, bodyElement);

		this.qualifiedName = new QualifiedName(node);
		this.namespaceDeclarations = new NamespaceDeclarationMap(this);
		this.children = root.buildSubtree(this);
	}

	toJSON() {
		const { bind, bodyElement, parent, root, ...rest } = this;

		return rest;
	}
}
