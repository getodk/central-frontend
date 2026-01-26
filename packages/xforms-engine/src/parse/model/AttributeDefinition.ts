import { XMLNS_NAMESPACE_URI } from '@getodk/common/constants/xmlns.ts';
import type { StaticAttribute } from '../../integration/xpath/static-dom/StaticAttribute.ts';
import {
	NamespaceDeclarationMap,
	type NamedNodeDefinition,
} from '../../lib/names/NamespaceDeclarationMap.ts';
import { QualifiedName } from '../../lib/names/QualifiedName.ts';
import { escapeXMLText, serializeAttributeXML } from '../../lib/xml-serialization.ts';
import type { BindDefinition } from './BindDefinition.ts';
import type { ModelDefinition } from './ModelDefinition.ts';
import { NodeDefinition } from './NodeDefinition.ts';
import type { RootDefinition } from './RootDefinition.ts';

export class AttributeDefinition
	extends NodeDefinition<'attribute'>
	implements NamedNodeDefinition
{
	private readonly serializedXML: string;

	readonly value: string;
	readonly type = 'attribute';
	readonly valueType = 'string';
	readonly namespaceDeclarations: NamespaceDeclarationMap;
	readonly bodyElement = null;
	readonly root: RootDefinition;
	readonly isTranslated: boolean = false;
	readonly parent = null;
	readonly children = null;
	readonly attributes = null;

	readonly qualifiedName: QualifiedName;

	constructor(
		readonly model: ModelDefinition,
		bind: BindDefinition,
		readonly template: StaticAttribute
	) {
		super(bind);

		const { value } = template;

		this.root = model.root;

		this.value = value;
		this.qualifiedName = template.qualifiedName;
		this.namespaceDeclarations = new NamespaceDeclarationMap(this);

		// We serialize namespace declarations separately
		if (this.qualifiedName.namespaceURI?.href === XMLNS_NAMESPACE_URI) {
			this.serializedXML = '';
		} else {
			const xmlValue = escapeXMLText(this.value, true);
			this.serializedXML = serializeAttributeXML(this.qualifiedName, xmlValue);
		}
	}

	serializeAttributeXML(): string {
		return this.serializedXML;
	}

	toJSON() {
		const { bind, bodyElement, parent, root, ...rest } = this;

		return rest;
	}
}
