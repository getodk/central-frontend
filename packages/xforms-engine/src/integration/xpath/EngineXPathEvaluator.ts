import type {
	DefaultDOMAdapterElement,
	DefaultDOMAdapterNode,
	DefaultEvaluatorOptions,
	XFormsItextTranslationMap,
	XFormsSecondaryInstanceMap,
} from '@getodk/xpath';
import { DEFAULT_DOM_ADAPTER, XFormsXPathEvaluator } from '@getodk/xpath';

interface EngineXPathEvaluatorOptions extends DefaultEvaluatorOptions {
	readonly rootNode: Document;
	readonly itextTranslationsByLanguage: XFormsItextTranslationMap<DefaultDOMAdapterElement>;
	readonly secondaryInstancesById: XFormsSecondaryInstanceMap<DefaultDOMAdapterElement>;
}

export class EngineXPathEvaluator extends XFormsXPathEvaluator<DefaultDOMAdapterNode> {
	constructor(options: EngineXPathEvaluatorOptions) {
		super({
			domAdapter: DEFAULT_DOM_ADAPTER,
			...options,
		});
	}
}
