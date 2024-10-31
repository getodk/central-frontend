import type {
	DefaultDOMAdapterNode,
	XFormsItextTranslationElement,
	XFormsItextTranslationMap,
} from '@getodk/xpath';
import type { DOMItextTranslationElement, XFormDOM } from '../../XFormDOM.ts';

/** @todo remove */
// prettier-ignore
export type ItextTranslationRootDefinition =
	& DOMItextTranslationElement
	& XFormsItextTranslationElement<DefaultDOMAdapterNode>;

/** @todo remove */
interface ItextTranslationDefinition {
	readonly root: ItextTranslationRootDefinition;
}

export class ItextTranslationsDefinition
	extends Map<string, ItextTranslationRootDefinition>
	implements XFormsItextTranslationMap<DefaultDOMAdapterNode>
{
	static from(xformDOM: XFormDOM): ItextTranslationsDefinition {
		const translationDefinitions = xformDOM.itextTranslationElements.map((element) => {
			element satisfies DOMItextTranslationElement;
			const root = element as ItextTranslationRootDefinition;

			return { root };
		});

		return new this(translationDefinitions);
	}

	private constructor(translations: readonly ItextTranslationDefinition[]) {
		super(
			translations.map(({ root }) => {
				return [root.getAttribute('lang'), root];
			})
		);
	}
}
