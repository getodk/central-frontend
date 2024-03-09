import { XFormsXPathEvaluator } from '@odk-web-forms/xpath';
import type { Signal } from 'solid-js';
import { createSignal } from 'solid-js';
import type { EntryState } from './EntryState.ts';

type EvaluatorTranslations = XFormsXPathEvaluator['translations'];

interface ActiveEvaluatorTranslations extends EvaluatorTranslations {
	getLanguages(): readonly [string, ...string[]];
	getActiveLanguage(): string;
	setActiveLanguage(language: string): string;
}

const isActiveEvaluatorTranslations = (
	translations: EvaluatorTranslations
): translations is ActiveEvaluatorTranslations => {
	return translations.getActiveLanguage() != null;
};

export class TranslationState {
	static from(entry: EntryState): TranslationState | null {
		const { translations } = entry.evaluator;

		if (isActiveEvaluatorTranslations(translations)) {
			return new this(translations);
		}

		return null;
	}

	protected readonly languages: readonly string[] = [];
	protected readonly activeLanguageState: Signal<string>;

	readonly isTranslated: boolean;

	protected constructor(protected readonly translations: ActiveEvaluatorTranslations) {
		const languages = translations.getLanguages();

		this.isTranslated = languages.length > 0;
		this.languages = translations.getLanguages();
		this.activeLanguageState = createSignal(translations.getActiveLanguage());
	}

	getLanguages(): readonly string[] {
		return this.languages;
	}

	getActiveLanguage(): string | null {
		const [activeLanguage] = this.activeLanguageState;

		return activeLanguage();
	}

	setActiveLanguage(language: string): string {
		const [, setActiveLanguage] = this.activeLanguageState;

		return setActiveLanguage(() => {
			this.translations.setActiveLanguage(language);
			return language;
		});
	}
}
