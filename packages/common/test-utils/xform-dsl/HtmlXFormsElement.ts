import type { BodyXFormsElement } from './BodyXFormsElement.ts';
import type { HeadXFormsElement } from './HeadXFormsElement.ts';
import { TagXFormsElement } from './TagXFormsElement.ts';
import type { XFormsElement } from './XFormsElement.ts';

type NamespaceTuple = readonly [nodeName: string, namespaceURI: string];

export type NamespaceTuples = readonly NamespaceTuple[];

const domParser = new DOMParser();

export class HtmlXFormsElement extends TagXFormsElement implements XFormsElement {
	override readonly name = 'h:html';

	constructor(
		head: HeadXFormsElement,
		body: BodyXFormsElement,
		additionalNamespaces: NamespaceTuples = []
	) {
		const namespaces: NamespaceTuples = [
			['xmlns', 'http://www.w3.org/2002/xforms'],
			['xmlns:h', 'http://www.w3.org/1999/xhtml'],
			['xmlns:jr', 'http://openrosa.org/javarosa'],
			['xmlns:odk', 'http://www.opendatakit.org/xforms'],
			['xmlns:orx', 'http://openrosa.org/xforms'],
			...additionalNamespaces,
		];

		super('h:html', new Map(namespaces), [head, body]);
	}

	asXMLDocument(): XMLDocument {
		return domParser.parseFromString(this.asXml(), 'text/xml');
	}
}
