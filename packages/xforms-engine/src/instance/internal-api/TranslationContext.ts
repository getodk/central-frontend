import type { ActiveLanguage } from '../../index.ts';

export interface TranslationContext {
	get activeLanguage(): ActiveLanguage;
}
