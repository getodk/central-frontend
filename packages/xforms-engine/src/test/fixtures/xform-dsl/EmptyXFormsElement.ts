import type { XFormsElement } from './XFormsElement.ts';
import { buildAttributesString } from './shared.ts';

export class EmptyXFormsElement implements XFormsElement {
	constructor(
		protected readonly name: string,
		protected readonly attributes: ReadonlyMap<string, string>
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

		return `<${name}${attributesString}/>`;
	}
}
