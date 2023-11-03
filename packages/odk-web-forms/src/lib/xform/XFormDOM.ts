import { XFormXPathEvaluator } from '../xpath/XFormXPathEvaluator.ts';

const domParser = new DOMParser();

export class XFormDOM {
	// XPath
	readonly rootEvaluator: XFormXPathEvaluator;
	readonly primaryInstanceEvaluator: XFormXPathEvaluator;

	// Commonly accessed landmark nodes
	readonly xformDocument: XMLDocument;

	readonly html: Element;

	readonly head: Element;
	readonly title: Element;

	readonly model: Element;
	readonly primaryInstance: Element;
	readonly primaryInstanceRoot: Element;

	constructor(protected readonly sourceXML: string) {
		const xformDocument: XMLDocument = domParser.parseFromString(sourceXML, 'text/xml');
		const rootEvaluator = new XFormXPathEvaluator(xformDocument);
		const html = rootEvaluator.evaluateNonNullElement('/h:html');
		const head = rootEvaluator.evaluateNonNullElement('./h:head', {
			contextNode: html,
		});
		const title = rootEvaluator.evaluateNonNullElement('./h:title', {
			contextNode: head,
		});
		const model = rootEvaluator.evaluateNonNullElement('./xf:model', {
			contextNode: head,
		});
		const primaryInstanceRoot = rootEvaluator.evaluateNonNullElement('./xf:instance/*[@id]', {
			contextNode: model,
		});
		const primaryInstance = rootEvaluator.evaluateNonNullElement('..', {
			contextNode: primaryInstanceRoot,
		});

		this.rootEvaluator = rootEvaluator;
		this.primaryInstanceEvaluator = new XFormXPathEvaluator(primaryInstance);
		this.xformDocument = xformDocument;
		this.html = html;
		this.head = head;
		this.title = title;
		this.model = model;
		this.primaryInstance = primaryInstance;
		this.primaryInstanceRoot = primaryInstanceRoot;
	}

	// TODO: anticipating this will be an entry point for edits as well
	createInstance(): XFormDOM {
		return new XFormDOM(this.sourceXML);
	}
}
