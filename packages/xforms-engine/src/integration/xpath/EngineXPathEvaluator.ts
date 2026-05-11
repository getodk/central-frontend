import type { XFormsItextTranslationMap, XFormsSecondaryInstanceMap } from '@getodk/xpath';
import { XFormsXPathEvaluator } from '@getodk/xpath';
import type { PrimaryInstance } from '../../instance/PrimaryInstance.ts';
import type { ItextTranslationRootDefinition } from '../../parse/model/ItextTranslationsDefinition.ts';
import type { SecondaryInstanceRootDefinition } from '../../parse/model/SecondaryInstance/SecondaryInstancesDefinition.ts';
import { engineDOMAdapter } from './adapter/engineDOMAdapter.ts';
import type { EngineXPathNode } from './adapter/kind.ts';

interface EngineXPathEvaluatorOptions {
	readonly rootNode: PrimaryInstance;
	readonly itextTranslationsByLanguage: XFormsItextTranslationMap<ItextTranslationRootDefinition>;
	readonly secondaryInstancesById: XFormsSecondaryInstanceMap<SecondaryInstanceRootDefinition>;
}

export class EngineXPathEvaluator extends XFormsXPathEvaluator<EngineXPathNode> {
	constructor(options: EngineXPathEvaluatorOptions) {
		super({
			domAdapter: engineDOMAdapter,
			...options,
		});
	}
}
