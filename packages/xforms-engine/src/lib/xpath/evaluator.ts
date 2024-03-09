import { XFormsXPathEvaluator } from '@odk-web-forms/xpath';
import { xpathParser } from './parser.ts';

export const xpathEvaluator = (rootNode: Element | XMLDocument): XFormsXPathEvaluator => {
	return new XFormsXPathEvaluator(xpathParser, { rootNode });
};
