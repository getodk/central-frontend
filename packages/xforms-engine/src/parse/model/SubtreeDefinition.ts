import { NamespaceDeclarationMap } from '../../lib/names/NamespaceDeclarationMap.ts';
import { QualifiedName } from '../../lib/names/QualifiedName.ts';
import type {
	AnyBodyElementDefinition,
	AnyGroupElementDefinition,
} from '../body/BodyDefinition.ts';
import type { BindDefinition } from './BindDefinition.ts';
import { DescendentNodeDefinition } from './DescendentNodeDefinition.ts';
import type { ChildNodeDefinition, ParentNodeDefinition } from './NodeDefinition.ts';

export class SubtreeDefinition extends DescendentNodeDefinition<
	'subtree',
	AnyGroupElementDefinition | null
> {
	readonly type = 'subtree';

	readonly namespaceDeclarations: NamespaceDeclarationMap;
	readonly qualifiedName: QualifiedName;
	readonly children: readonly ChildNodeDefinition[];
	readonly instances = null;
	readonly defaultValue = null;

	constructor(
		parent: ParentNodeDefinition,
		bind: BindDefinition,
		bodyElement: AnyBodyElementDefinition | null,
		readonly node: Element
	) {
		if (
			bodyElement != null &&
			(bodyElement.category !== 'structure' || bodyElement.type === 'repeat')
		) {
			throw new Error(`Unexpected body element for nodeset ${bind.nodeset}`);
		}

		super(parent, bind, bodyElement);

		const { root } = parent;

		this.qualifiedName = new QualifiedName(node);
		this.namespaceDeclarations = new NamespaceDeclarationMap(this);
		this.children = root.buildSubtree(this);
	}

	toJSON() {
		const { parent, bodyElement, bind, root, ...rest } = this;

		return rest;
	}
}
