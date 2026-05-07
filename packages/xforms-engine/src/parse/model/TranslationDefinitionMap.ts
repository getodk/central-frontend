import type { DOMItextTranslationElement } from '../XFormDOM.ts';

const generateChunksForLanguage = (
	translationElement: DOMItextTranslationElement
): Map<string, Element> => {
	return new Map(
		Array.from(translationElement.children).map((textElement) => {
			const itextId = textElement.getAttribute('id');
			return [itextId!, textElement] as const;
		})
	);
};

export class TranslationDefinitionMap extends Map<string, Map<string, Element>> {
	constructor(translationElements: readonly DOMItextTranslationElement[]) {
		super(
			translationElements.map((translationElement) => {
				const lang = translationElement.getAttribute('lang');
				return [lang, generateChunksForLanguage(translationElement)] as const;
			})
		);
	}
}
