import { UpsertableMap } from '../../../lib/collections/UpsertableMap.ts';
import type { XFormsElement } from './XFormsElement.ts';

const xmlLiteralNameCache = new UpsertableMap<string, string>();

/**
 * PROPOSED: a convenience wrapper for raw XML implementing the common
 * {@link XFormsElement} interface.
 */
export class PROPOSED_XMLLiteralXFormsElement implements XFormsElement {
	private name: string | null;

	constructor(private readonly xmlLiteral: string) {
		this.name = xmlLiteralNameCache.get(xmlLiteral) ?? null;
	}

	getName(): string {
		const { name, xmlLiteral } = this;

		if (name != null) {
			return name;
		}

		this.name = xmlLiteralNameCache.upsert(xmlLiteral, () => {
			const domParser = new DOMParser();
			const doc = domParser.parseFromString(xmlLiteral, 'text/xml');

			return doc.documentElement.nodeName;
		});

		return this.name;
	}

	asXml(): string {
		return this.xmlLiteral;
	}
}
