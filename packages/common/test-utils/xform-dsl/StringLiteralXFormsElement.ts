import type { XFormsElement } from './XFormsElement.ts';
import { buildAttributesString } from './shared.ts';

export class StringLiteralXFormsElement implements XFormsElement {
	constructor(
		protected readonly name: string,
		protected readonly attributes: ReadonlyMap<string, string>,
		protected readonly innerHtml: string
	) {}

	getName(): string {
		return this.name;
	}

	asXml(): string {
		const { attributes, name } = this;

		let attributesString = buildAttributesString(attributes);

		if (attributesString !== '') {
			attributesString = ` ${attributesString}`;
		}

		return `<${name}${attributesString}>${this.innerHtml}</${name}>`;
	}
}
