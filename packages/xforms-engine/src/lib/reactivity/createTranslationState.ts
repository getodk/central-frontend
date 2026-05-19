import type { XFormsXPathEvaluator } from '@getodk/xpath';
import type { Accessor } from 'solid-js';
import { createComputed, createSignal } from 'solid-js';
import type { ActiveLanguage, FormLanguage, FormLanguages } from '../../client/FormLanguage.ts';
import type { EngineXPathEvaluator } from '../../integration/xpath/EngineXPathEvaluator.ts';
import type { ReactiveScope } from './scope.ts';
import type { SimpleAtomicStateSetter } from './types.ts';

const IANA_PATTERN = /[a-zA-Z]{2,3}(?:-[a-zA-Z]{4})?(?:-(?:[a-zA-Z]{2}|[0-9]{3}))?/;
// Language definition in parentheses: "English (en)" -> extracts "en"
const LOCALE_IN_PARENS_REGEX = new RegExp(`\\((${IANA_PATTERN.source})\\)`);
// Forms missing parentheses: "English en-US" -> extracts "en-US"
const LOCALE_AFTER_SPACE_REGEX = new RegExp(` (${IANA_PATTERN.source})$`);
// Explicit language codes without human-readable labels: "en-US" -> matches "en-US"
const EXACT_LOCALE_REGEX = new RegExp(`^${IANA_PATTERN.source}$`);

interface TranslationState {
	readonly languages: FormLanguages;
	readonly getActiveLanguage: Accessor<ActiveLanguage>;
	readonly setActiveLanguage: SimpleAtomicStateSetter<FormLanguage>;
}

const extractLocale = (lang: string): Intl.Locale | undefined => {
	const cleanLang = lang?.trim();
	if (!cleanLang) {
		return;
	}

	const match =
		LOCALE_IN_PARENS_REGEX.exec(cleanLang)?.[1] ??
		LOCALE_AFTER_SPACE_REGEX.exec(cleanLang)?.[1] ??
		(EXACT_LOCALE_REGEX.test(cleanLang) ? cleanLang : undefined);

	if (match) {
		try {
			return new Intl.Locale(match.trim());
		} catch {
			// eslint-disable-next-line no-console
			console.warn(`ODK XForms Engine: Could not parse locale from "${lang}"`);
			return;
		}
	}

	return;
};

/**
 * @todo It's been very silly all along that {@link XFormsXPathEvaluator} is
 * responsible for parsing translation languages, and maintaining the active
 * language state. It is especially silly now that we've moved _part of the
 * parsing_ up to the constructor call site. Let's finish off that awkwardness
 * in a subsequent refactor.
 */
export const createTranslationState = (
	scope: ReactiveScope,
	evaluator: EngineXPathEvaluator
): TranslationState => {
	const activeLanguageName = evaluator.getActiveLanguage();
	const languageNames = evaluator.getLanguages();
	const explicitDefaultLanguageName = evaluator.getExplicitDefaultLanguage();

	let defaultLanguage: ActiveLanguage;
	let languages: FormLanguages;

	if (activeLanguageName == null) {
		defaultLanguage = { isSyntheticDefault: true, language: '', isDefault: false };
		languages = [defaultLanguage];
	} else {
		const formLanguages = languageNames.map((language) => ({
			language,
			locale: extractLocale(language),
			isDefault: language === explicitDefaultLanguageName,
		}));

		defaultLanguage = formLanguages.find((l) => l.language === activeLanguageName)!;
		languages = formLanguages as [FormLanguage, ...FormLanguage[]];
	}

	const [getActiveLanguage, baseSetActiveLanguage] = createSignal(defaultLanguage);

	const setActiveLanguage: SimpleAtomicStateSetter<FormLanguage> = (value) => {
		return baseSetActiveLanguage(value);
	};

	scope.runTask(() => {
		createComputed(() => {
			evaluator.setActiveLanguage(getActiveLanguage().language);
		});
	});

	return {
		languages,
		getActiveLanguage,
		setActiveLanguage,
	};
};
