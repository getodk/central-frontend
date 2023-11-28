import { XFormsXPathEvaluator } from '@odk/xpath';
import { xpathParser } from './parser.ts';

export const xpathEvaluator = (rootNode: Element | XMLDocument): XFormsXPathEvaluator => {
	return new XFormsXPathEvaluator(xpathParser, { rootNode });
};
