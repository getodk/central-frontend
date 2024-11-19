import type { XFormsXPathEvaluator } from '@getodk/xpath';
import type { Accessor } from 'solid-js';
import { createComputed, createSignal } from 'solid-js';
import type { ActiveLanguage, FormLanguage, FormLanguages } from '../../client/FormLanguage.ts';
import type { EngineXPathEvaluator } from '../../integration/xpath/EngineXPathEvaluator.ts';
import type { ReactiveScope } from './scope.ts';
import type { SimpleAtomicStateSetter } from './types.ts';

interface TranslationState {
	readonly languages: FormLanguages;
	readonly getActiveLanguage: Accessor<ActiveLanguage>;
	readonly setActiveLanguage: SimpleAtomicStateSetter<FormLanguage>;
}

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

	let defaultLanguage: ActiveLanguage;
	let languages: FormLanguages;

	if (activeLanguageName == null) {
		defaultLanguage = { isSyntheticDefault: true, language: '' };
		languages = [defaultLanguage];
	} else {
		const inactiveLanguages = languageNames
			.filter((languageName) => languageName !== activeLanguageName)
			.map((language) => ({ language }));

		defaultLanguage = { language: activeLanguageName };
		languages = [defaultLanguage, ...inactiveLanguages];
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
