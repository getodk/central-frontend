import type { StaticAttribute } from '../../integration/xpath/static-dom/StaticAttribute.ts';
import type { StaticDocument } from '../../integration/xpath/static-dom/StaticDocument.ts';
import type { StaticElement } from '../../integration/xpath/static-dom/StaticElement.ts';
import type { AttributeDefinition } from '../../parse/model/AttributeDefinition.ts';
import { Attribute } from '../Attribute';
import type { AnyNode } from '../hierarchy.ts';
import type { InputControl } from '../InputControl.ts';
import type { ModelValue } from '../ModelValue.ts';
import type { Note } from '../Note.ts';
import type { RangeControl } from '../RangeControl.ts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AttributeOwner = AnyNode | InputControl<any> | ModelValue<any> | Note<any> | RangeControl<any>;

function buildInstanceAttributeMap(
  instanceNode: StaticAttribute | StaticDocument | StaticElement | null
): Map<string, StaticAttribute> {
  const map = new Map<string, StaticAttribute>();
  if (!instanceNode) {
    return map;
  }
  for (const attribute of instanceNode.attributes) {
    map.set(attribute.qualifiedName.getPrefixedName(), attribute);
  }
  return map;
}

/**
 * Root's `version` reflects the current form definition, not the source XML.
 * Submissions should carry the latest form definition's version.
 */
const isFormMetadataAttribute = (
  owner: AttributeOwner,
  attributeDefinition: AttributeDefinition
) => {
  return owner.nodeType === 'root' && attributeDefinition.qualifiedName.localName === 'version';
};

const resolveAttributeSourceNode = (
  owner: AttributeOwner,
  attributeDefinition: AttributeDefinition,
  instanceAttributes: Map<string, StaticAttribute>
): StaticAttribute => {
  if (isFormMetadataAttribute(owner, attributeDefinition)) {
    return attributeDefinition.template;
  }

  const instanceAttribute = instanceAttributes.get(
    attributeDefinition.qualifiedName.getPrefixedName()
  );

  return instanceAttribute ?? attributeDefinition.template;
};

export function buildAttributes(owner: AttributeOwner): Attribute[] {
  const attributes = owner.definition.attributes;
  if (!attributes) {
    return [];
  }
  const instanceAttributes = buildInstanceAttributeMap(owner.instanceNode);
  return Array.from(attributes.values()).map((attributeDefinition) => {
    const sourceNode = resolveAttributeSourceNode(owner, attributeDefinition, instanceAttributes);
    return new Attribute(owner, attributeDefinition, sourceNode);
  });
}
