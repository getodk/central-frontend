import type { XFormsElement } from './XFormsElement.ts';
import { buildAttributesString } from './shared.ts';

export class TagXFormsElement implements XFormsElement {
	constructor(
		protected readonly name: string,
		protected readonly attributes: ReadonlyMap<string, string>,
		protected readonly children: readonly XFormsElement[]
	) {}

	getName(): string {
		return this.name;
	}

	asXml(): string {
		const { attributes, children, name } = this;

		let attributesString = buildAttributesString(attributes);

		if (attributesString !== '') {
			attributesString = ` ${attributesString}`;
		}

		const xmlProcessingInstruction = name === 'h:html' ? '<?xml version="1.0"?>' : '';

		const innerHtml = children.map((child) => child.asXml()).join('');

		return `${xmlProcessingInstruction}<${name}${attributesString}>${innerHtml}</${name}>`;
	}
}
