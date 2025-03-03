import type { StaticDocument } from '../../integration/xpath/static-dom/StaticDocument.ts';
import { parseStaticDocumentFromDOMSubtree } from './parseStaticDocumentFromDOMSubtree.ts';

export const parseStaticDocumentFromXML = (xml: string): StaticDocument => {
	const parser = new DOMParser();
	const xmlDocument = parser.parseFromString(xml, 'text/xml');

	return parseStaticDocumentFromDOMSubtree(xmlDocument.documentElement);
};
