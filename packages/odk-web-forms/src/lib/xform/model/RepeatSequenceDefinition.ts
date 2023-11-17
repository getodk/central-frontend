import { JAVAROSA_NAMESPACE_URI } from '@odk/common/constants/xmlns.ts';
import { RepeatGroupDefinition } from '../body/group/RepeatGroupDefinition.ts';
import type { BindDefinition } from './BindDefinition.ts';
import type { ParentNodeDefinition } from './NodeDefinition.ts';
import { RepeatInstanceDefinition } from './RepeatInstanceDefinition.ts';
import type { RootDefinition } from './RootDefinition.ts';

export class RepeatSequenceDefinition {
	// TODO: if an implicit template is derived from an instance in a form
	// definition, should its default values (if any) be cleared? Probably!
	static createTemplateElement(instanceElement: Element): Element {
		return instanceElement.cloneNode(true) as Element;
	}

	static createInstanceElement(templateElement: Element): Element {
		return templateElement.cloneNode(true) as Element;
	}

	readonly type = 'repeat-sequence';

	readonly root: RootDefinition;
	readonly instances: readonly RepeatInstanceDefinition[];

	readonly templateElement: Element;

	constructor(
		readonly parent: ParentNodeDefinition,
		readonly bind: BindDefinition,
		readonly groupDefinition: RepeatGroupDefinition,
		readonly elements: readonly [Element, ...Element[]]
	) {
		const { root } = parent;

		this.root = root;
		this.bind = bind;

		let templateElement: Element;
		let instanceElements: readonly Element[];

		const [firstElement, ...restElements] = elements;

		const isFirstElementTemplate = firstElement.hasAttributeNS(JAVAROSA_NAMESPACE_URI, 'template');

		if (isFirstElementTemplate) {
			templateElement = firstElement.cloneNode(true) as Element;
			templateElement.removeAttributeNS(JAVAROSA_NAMESPACE_URI, 'template');
			instanceElements = restElements;
		} else {
			// Should empty leaf/bound nodes here?
			templateElement = firstElement.cloneNode(true) as Element;
			instanceElements = elements;
		}

		this.templateElement = templateElement;

		const repeatDefinition = groupDefinition.repeat;

		this.instances = instanceElements.map((element, index) => {
			return new RepeatInstanceDefinition(this, parent, bind, repeatDefinition, element, index);
		});
	}

	toJSON() {
		const { bind, groupDefinition, parent, root, ...rest } = this;

		return rest;
	}
}
