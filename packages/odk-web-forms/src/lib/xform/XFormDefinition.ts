import { XFormXPathEvaluator } from '../xpath/XFormXPathEvaluator.ts';
import {
	XFormModelDefinition,
	type XFormModelDefinitionCommonElements,
} from './XFormModelDefinition.ts';
import { XFormViewDefinition } from './XFormViewDefinition.ts';

/**
 * @private
 */
class XFormsDefinitionCommonElements implements XFormModelDefinitionCommonElements {
	readonly html: Element;

	readonly head: Element;
	readonly title: Element;

	readonly model: Element;
	readonly primaryInstance: Element;
	readonly primaryInstanceRoot: Element;

	readonly body: Element;

	constructor(evaluator: XFormXPathEvaluator) {
		const html = (this.html = evaluator.evaluateNonNullElement('/h:html'));
		const head = (this.head = evaluator.evaluateNonNullElement('./h:head', {
			contextNode: html,
		}));

		this.title = evaluator.evaluateNonNullElement('./h:title', {
			contextNode: head,
		});

		const model = (this.model = evaluator.evaluateNonNullElement('./xf:model', {
			contextNode: head,
		}));
		const primaryInstance = (this.primaryInstance = evaluator.evaluateNonNullElement(
			'./xf:instance[1]',
			{
				contextNode: model,
			}
		));

		this.primaryInstanceRoot = evaluator.evaluateNonNullElement('./*', {
			contextNode: primaryInstance,
		});

		this.body = evaluator.evaluateNonNullElement('./h:body', {
			contextNode: html,
		});
	}
}

const domParser = new DOMParser();

export class XFormDefinition {
	static fromSourceXML(sourceXML: string) {
		const xformDocument: XMLDocument = domParser.parseFromString(sourceXML, 'text/xml');

		return new this(xformDocument);
	}

	readonly rootEvaluator: XFormXPathEvaluator;

	readonly id: string;
	readonly title: string;

	readonly commonElements: XFormsDefinitionCommonElements;

	readonly model: XFormModelDefinition;
	readonly view: XFormViewDefinition;

	constructor(readonly xformDocument: XMLDocument) {
		const evaluator = (this.rootEvaluator = new XFormXPathEvaluator(xformDocument));
		const commonElements = (this.commonElements = new XFormsDefinitionCommonElements(evaluator));

		const id = commonElements.primaryInstanceRoot.getAttribute('id');

		if (id == null) {
			throw new Error('Primary instance root has no id');
		}

		this.id = id;
		this.title = commonElements.title.textContent;

		this.model = new XFormModelDefinition(this, commonElements);
		this.view = new XFormViewDefinition(this, evaluator);
	}

	toJSON() {
		const { rootEvaluator, ...rest } = this;

		return rest;
	}
}
