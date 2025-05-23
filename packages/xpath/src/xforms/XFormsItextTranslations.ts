import { UpsertableWeakMap } from '@getodk/common/lib/collections/UpsertableWeakMap.ts';
import type { XPathNode } from '../adapter/interface/XPathNode.ts';
import type { XPathDOMProvider } from '../adapter/xpathDOMProvider.ts';
import type { itext } from '../functions/javarosa/node-set.ts';
import type { XFormsElementRepresentation } from './XFormsElementRepresentation.ts';
import type { XFormsXPathEvaluator } from './XFormsXPathEvaluator.ts';

type XFormsItextTextID = string;

export type XFormsItextTranslationValueElement<T extends XPathNode> = XFormsElementRepresentation<
	T,
	'value',
	'form'
>;

type XFormsItextTranslationTextElement<T extends XPathNode> = XFormsElementRepresentation<
	T,
	'text'
>;

export type XFormsItextTranslationElement<T extends XPathNode> = XFormsElementRepresentation<
	T,
	'translation',
	'lang'
>;

type XFormsItextTextMap<T extends XPathNode> = ReadonlyMap<
	XFormsItextTextID,
	XFormsItextTranslationTextElement<T>
>;

type XFormsItextTranslationsCache<T extends XPathNode> = UpsertableWeakMap<
	XFormsItextTranslationElement<T>,
	XFormsItextTextMap<T>
>;

export type XFormsItextTranslationLanguage = string;

export type XFormsItextTranslationMap<T extends XPathNode> = ReadonlyMap<
	XFormsItextTranslationLanguage,
	XFormsItextTranslationElement<T>
>;

interface TranslationMetadata {
	readonly defaultLanguage: XFormsItextTranslationLanguage | null;
	readonly languages: readonly XFormsItextTranslationLanguage[];
}

/**
 * Public interface to an {@link XFormsXPathEvaluator}'s ODK XForms
 * {@link https://getodk.github.io/xforms-spec/#languages | active language state}.
 */
export interface XFormsItextTranslationsState {
	getLanguages(): readonly XFormsItextTranslationLanguage[];
	getActiveLanguage(): XFormsItextTranslationLanguage | null;
	setActiveLanguage(
		language: XFormsItextTranslationLanguage | null
	): XFormsItextTranslationLanguage | null;
}

/**
 * @package
 *
 * This is an internal implementation/API providing support for {@link itext}.
 *
 * As specified by
 * {@link https://getodk.github.io/xforms-spec/#fn:jr:itext | ODK XForms `jr:itext`},
 * the function depends on implicit "active language" state. The corresponding
 * {@link XFormsItextTranslationsState} **public interface** exposes access to get
 * and set that state for `@getodk/xpath` consumers.
 *
 * @see {@link XFormsItextTranslationsState} for the corresponding public interface.
 */
export class XFormsItextTranslations<T extends XPathNode> implements XFormsItextTranslationsState {
	protected readonly defaultLanguage: XFormsItextTranslationLanguage | null = null;
	protected readonly languages: readonly XFormsItextTranslationLanguage[] = [];

	protected activeLanguage: XFormsItextTranslationLanguage | null = null;

	readonly translationsCache: XFormsItextTranslationsCache<T> = new UpsertableWeakMap();

	constructor(
		readonly domProvider: XPathDOMProvider<T>,
		readonly translationElementMap: XFormsItextTranslationMap<T>
	) {
		this.domProvider = domProvider;

		this.translationElementMap = translationElementMap;

		const { defaultLanguage, languages } = this.getTranslationMetadata(
			domProvider,
			translationElementMap
		);

		this.defaultLanguage = defaultLanguage;
		this.activeLanguage = defaultLanguage;
		this.languages = languages;
	}

	private getTranslationMetadata(
		domProvider: XPathDOMProvider<T>,
		translationElementMap: XFormsItextTranslationMap<T>
	): TranslationMetadata {
		const languages: XFormsItextTranslationLanguage[] = [];

		let defaultLanguage: XFormsItextTranslationLanguage | null = null;

		for (const [language, element] of translationElementMap) {
			if (defaultLanguage == null && domProvider.hasLocalNamedAttribute(element, 'default')) {
				defaultLanguage = language;
				languages.unshift(language);
			} else {
				languages.push(language);
			}
		}

		defaultLanguage ??= languages[0] ?? null;

		return {
			defaultLanguage,
			languages,
		};
	}

	private getTranslationTextElement(itextID: string): XFormsItextTranslationTextElement<T> | null {
		const activeLanguage = this.getActiveLanguage();

		if (activeLanguage == null) {
			return null;
		}

		const { domProvider, translationElementMap, translationsCache } = this;
		const translationElement = translationElementMap.get(activeLanguage);

		if (translationElement == null) {
			return null;
		}

		const textMap = translationsCache.upsert(translationElement, () => {
			const textElements = domProvider.getChildrenByLocalName(
				translationElement,
				'text'
			) as ReadonlyArray<XFormsItextTranslationTextElement<T>>;

			return new Map(
				textElements.flatMap((element) => {
					const id = domProvider.getLocalNamedAttributeValue(element, 'id');

					// TODO: what does it mean for itext > translation > <text> without id
					// attribute? Here we ignore it. But it's definitely unexpected. We should
					// probably at least produce a warning. Or an error?
					if (id == null) {
						return [];
					}

					return [[id, element]];
				})
			);
		});

		return textMap.get(itextID) ?? null;
	}

	/**
	 * Retrieves all translation value elements for a given Itext in the active language.
	 *
	 * @package
	 *
	 * This method fetches the `text` element matching `itextID` and returns its child `value` elements,
	 * which may have an optional `@form` attribute.
	 *
	 * The operation is conceptually similar to the following XPath query:
	 *
	 * ```xpath
	 * imaginary:itext-translation(
	 *   xpath3-fn:environment-variable('activeLanguage')
	 * )
	 *   /text[@id = $itextID]
	 *     /value
	 * ```
	 *
	 * Or alternately:
	 *
	 * ```xpath
	 * imaginary:itext-root()
	 *   /translation[@lang = xpath3-fn:environment-variable('activeLanguage')]
	 *     /text[@id = $itextID]
	 *       /value
	 * ```
	 * Returns an array of `XFormsItextTranslationValueElement<T>`
	 */
	getTranslationValues(itextID: string): Array<XFormsItextTranslationValueElement<T>> {
		const textElement = this.getTranslationTextElement(itextID);

		if (textElement == null) {
			return [];
		}

		return [...this.domProvider.getChildrenByLocalName(textElement, 'value')] as Array<
			XFormsItextTranslationValueElement<T>
		>;
	}

	getLanguages(): readonly XFormsItextTranslationLanguage[] {
		return this.languages;
	}

	getActiveLanguage(): XFormsItextTranslationLanguage | null {
		return this.activeLanguage;
	}

	setActiveLanguage(
		language: XFormsItextTranslationLanguage | null
	): XFormsItextTranslationLanguage | null {
		this.activeLanguage = language ?? this.defaultLanguage;

		return this.activeLanguage;
	}
}
