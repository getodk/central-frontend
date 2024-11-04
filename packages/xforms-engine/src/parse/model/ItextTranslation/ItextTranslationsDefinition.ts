import type { XFormsItextTranslationMap } from '@getodk/xpath';
import type { EngineXPathNode } from '../../../integration/xpath/adapter/kind.ts';
import { parseStaticDocumentFromDOMSubtree } from '../../shared/parseStaticDocumentFromDOMSubtree.ts';
import type { XFormDOM } from '../../XFormDOM.ts';
import { ItextTranslationDefinition } from './ItextTranslationDefinition.ts';
import { ItextTranslationRootDefinition } from './ItextTranslationRootDefinition.ts';

export class ItextTranslationsDefinition
	extends Map<string, ItextTranslationRootDefinition>
	implements XFormsItextTranslationMap<EngineXPathNode>
{
	static from(xformDOM: XFormDOM): ItextTranslationsDefinition {
		const translationDefinitions = xformDOM.itextTranslationElements.map((element) => {
			return parseStaticDocumentFromDOMSubtree(
				ItextTranslationDefinition,
				ItextTranslationRootDefinition,
				element
			);
		});

		return new this(translationDefinitions);
	}

	private constructor(translations: readonly ItextTranslationDefinition[]) {
		super(
			translations.map(({ root }) => {
				return [root.getAttributeValue('lang'), root];
			})
		);
	}
}
