import { XFormXPathEvaluator } from '../xpath/XFormXPathEvaluator';
import type { XFormDefinition, XFormViewControl } from './types';

const domParser = new DOMParser();

export const parseXForm = (xformXML: string): XFormDefinition => {
	const xformDocument: XMLDocument = domParser.parseFromString(xformXML, 'text/xml');
	const xformEvaluator = new XFormXPathEvaluator(xformDocument);

	const title = xformEvaluator.evaluateString('/h:html/h:head/h:title');
	const viewControlElements = xformEvaluator.evaluateNodes<Element>('/h:html/h:body/xf:*');

	const viewControls: XFormViewControl[] = viewControlElements.map((viewControlElement) => {
		const viewControlOptions = {
			contextNode: viewControlElement,
		};
		const { localName: type } = viewControlElement;
		const ref = xformEvaluator.evaluateString('@ref', viewControlOptions);
		const labelElement = xformEvaluator.evaluateNode('./xf:label', viewControlOptions);

		const labelTextContent = labelElement?.textContent?.trim() ?? '';
		const label = labelTextContent.length > 0 ? labelTextContent : null;

		return {
			type,
			ref,
			label,
		};
	});

	return {
		title,
		viewControls,
		xformDocument,
	};
};
