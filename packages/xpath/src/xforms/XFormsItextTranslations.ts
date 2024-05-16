import { UpsertableWeakMap } from '@getodk/common/lib/collections/UpsertableWeakMap.ts';
import { ScopedElementLookup } from '@getodk/common/lib/dom/compatibility.ts';
import type {
	KnownAttributeLocalNamedElement,
	LocalNamedElement,
} from '@getodk/common/types/dom.ts';
import type { ModelElement, XFormsXPathEvaluator } from './XFormsXPathEvaluator.ts';

export interface ItextRootElement extends LocalNamedElement<'itext'> {}

const itextRootLookup = new ScopedElementLookup(':scope > itext', 'itext');

export const getItextRoot = (modelElement: ModelElement): ItextRootElement | null => {
	return itextRootLookup.getElement<ItextRootElement>(modelElement);
};

interface TranslationElement extends KnownAttributeLocalNamedElement<'translation', 'lang'> {}

const translationLookup = new ScopedElementLookup(
	':scope > translation[lang]',
	'translation[lang]'
);

type TranslationLanguage = string;

const translationElementsCache = new UpsertableWeakMap<
	ModelElement,
	ReadonlyMap<TranslationLanguage, TranslationElement>
>();

type TranslationElementMap = ReadonlyMap<TranslationLanguage, TranslationElement>;

const getTranslationElementMap = (modelElement: ModelElement): TranslationElementMap => {
	return translationElementsCache.upsert(modelElement, () => {
		const itextRoot = getItextRoot(modelElement);

		if (itextRoot == null) {
			return new Map();
		}

		const translationElements = Array.from(
			translationLookup.getElements<TranslationElement>(itextRoot)
		);

		return new Map(
			translationElements.map((element) => {
				return [element.getAttribute('lang'), element];
			})
		);
	});
};

const getTranslationElement = (
	modelElement: ModelElement,
	translationLanguage: TranslationLanguage
): TranslationElement | null => {
	const translationElementMap = getTranslationElementMap(modelElement);

	return translationElementMap.get(translationLanguage) ?? null;
};

interface TranslationTextElement extends KnownAttributeLocalNamedElement<'text', 'id'> {}

const translationTextLookup = new ScopedElementLookup(':scope > text[id]', 'text[id]');

type ItextID = string;

type TranslationTextMap = ReadonlyMap<ItextID, TranslationTextElement>;

const translationsCache = new UpsertableWeakMap<
	ModelElement,
	UpsertableWeakMap<TranslationElement, TranslationTextMap>
>();

export const getTranslationTextByLanguage = (
	modelElement: ModelElement,
	language: TranslationLanguage,
	itextID: ItextID
): TranslationTextElement | null => {
	const translationElement = getTranslationElement(modelElement, language);

	if (translationElement == null) {
		return null;
	}

	const textMaps = translationsCache.upsert(modelElement, () => {
		return new UpsertableWeakMap();
	});
	const textMap = textMaps.upsert(translationElement, () => {
		const textElements = Array.from(
			translationTextLookup.getElements<TranslationTextElement>(translationElement)
		);

		return new Map(
			textElements.map((element) => {
				return [element.getAttribute('id'), element];
			})
		);
	});

	return textMap.get(itextID) ?? null;
};

interface DefaultTextValueElement extends LocalNamedElement<'value'> {
	getAttribute(name: 'form'): null;
	getAttribute(name: string): string | null;
}

const defaultTextValueLookup = new ScopedElementLookup(
	':scope > value:not([form])',
	'value:not([form])'
);

export const getDefaultTextValueElement = (
	textElement: TranslationTextElement
): DefaultTextValueElement | null => {
	return defaultTextValueLookup.getElement<DefaultTextValueElement>(textElement);
};

interface TranslationMetadata {
	readonly defaultLanguage: string | null;
	readonly languages: readonly string[];
}

const getTranslationMetadata = (modelElement: ModelElement | null): TranslationMetadata => {
	const languages: string[] = [];

	let defaultLanguage: string | null = null;

	if (modelElement == null) {
		return {
			defaultLanguage,
			languages,
		};
	}

	const translationElementMap = getTranslationElementMap(modelElement);

	for (const [language, element] of translationElementMap) {
		if (defaultLanguage == null && element.hasAttribute('default')) {
			defaultLanguage = language;
			languages.unshift(language);
		} else {
			languages.push(language);
		}
	}

	if (defaultLanguage == null) {
		defaultLanguage = languages[0] ?? null;
	}

	return {
		defaultLanguage,
		languages,
	};
};

export class XFormsItextTranslations {
	protected readonly defaultLanguage: string | null;
	protected readonly languages: readonly string[];

	protected activeLanguage: string | null;

	constructor(protected readonly evaluator: XFormsXPathEvaluator) {
		const { defaultLanguage, languages } = getTranslationMetadata(evaluator.modelElement);

		this.defaultLanguage = defaultLanguage;
		this.activeLanguage = defaultLanguage;
		this.languages = languages;
	}

	getLanguages(): readonly string[] {
		return this.languages;
	}

	getActiveLanguage(): string | null {
		return this.activeLanguage;
	}

	setActiveLanguage(language: string | null): string | null {
		this.activeLanguage = language ?? this.defaultLanguage;

		return this.activeLanguage;
	}
}
