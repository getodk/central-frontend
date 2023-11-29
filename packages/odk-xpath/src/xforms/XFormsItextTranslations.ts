import type { XFormsNamespaceURI } from '@odk/common/constants/xmlns.ts';
import type { XFormsXPathEvaluator } from './XFormsXPathEvaluator.ts';

export interface XFormsItextContext {
	get language(): string | null;

	setLanguages(defaultLanguage: string, languages: readonly string[]): void;
}

interface XFormsItextRootElement extends Element {
	readonly namespaceURI: XFormsNamespaceURI;
	readonly localName: 'itext';
}

interface XFormsItextTranslationElement extends Element {
	readonly namespaceURI: XFormsNamespaceURI;
	readonly localName: 'translation';
	readonly parentNode: XFormsItextRootElement;

	getAttribute(name: 'lang'): string;
	getAttribute(name: string): string | null;
}

interface XFormsItextTextElement extends Element {
	readonly namspaceURI: XFormsNamespaceURI;
	readonly localName: 'text';

	getAttribute(name: 'id'): string;
	getAttribute(name: string): string | null;
}

export class XFormsItextTranslations {
	protected readonly defaultLanguage: string | null;
	protected readonly languages: readonly string[];
	protected readonly translationsByLanguage: Map<string, Map<string, string>>;

	protected activeLanguage: string | null;

	constructor(protected readonly evaluator: XFormsXPathEvaluator) {
		const { rootNode } = evaluator;
		const xformRoot = rootNode.ownerDocument ?? rootNode;
		// TODO: this clearly breaks out of `rootNode`'s hierarhy! It's exactly what
		// we want for this use case, but it's definitely something that should be
		// called out in any case where there might be an impression that `rootNode`
		// provides any kind of isolation guarantees.
		const translationElements = evaluator.evaluateNodes<XFormsItextTranslationElement>(
			'./h:html/h:head/xf:model/xf:itext/xf:translation[@lang]',
			{ contextNode: xformRoot }
		);
		// TODO: spec says this may be `"true()"` or `""`, what about other cases?
		const defaultTranslationElement =
			translationElements.find((translationElement) => {
				return translationElement.hasAttribute('default');
			}) ?? translationElements[0];

		const defaultLanguage = defaultTranslationElement?.getAttribute('lang') ?? null;
		const languages = translationElements.map((translationElement) => {
			return translationElement.getAttribute('lang');
		});

		this.defaultLanguage = defaultLanguage;
		this.activeLanguage = defaultLanguage;
		this.languages = languages;
		this.translationsByLanguage = new Map(
			translationElements.map((translationElement) => {
				const language = translationElement.getAttribute('lang');
				const textElements = evaluator.evaluateNodes<XFormsItextTextElement>('./xf:text[@id]', {
					contextNode: translationElement,
				});
				const translations = new Map(
					textElements.flatMap((textElement) => {
						const value = evaluator.evaluateString('./xf:value[not(@form)]', {
							contextNode: textElement,
						});

						if (value == null || value === '') {
							return [];
						}

						const id = textElement.getAttribute('id');

						return [[id, value]];
					})
				);

				return [language, translations];
			})
		);
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

	// TODO: currently only the default <value> (i.e. without a `form` attribute)
	// is supported.
	getTranslation(itextId: string): string | null {
		const language = this.activeLanguage ?? this.defaultLanguage;

		if (language == null) {
			return null;
		}

		const translations = this.translationsByLanguage.get(language);

		if (translations == null) {
			throw new Error(`No translations for language: ${language}`);
		}

		return translations.get(itextId) ?? null;
	}
}
