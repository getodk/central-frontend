import type { Accessor } from 'solid-js';
import type { ActiveLanguage } from '../../client/FormLanguage.ts';

export interface TranslationContext {
	readonly getActiveLanguage: Accessor<ActiveLanguage>;
}
