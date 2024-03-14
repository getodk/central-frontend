import type { JSX } from 'solid-js';
import { createContext } from 'solid-js';
import type { Localization } from '../lib/i18n-l10n/types';

interface LocalizationContextState {
	readonly localization: Localization | null;
	readonly localizations: readonly Localization[];
}

export const localizationContext = createContext<LocalizationContextState>({
	localization: null,
	localizations: [],
});

interface LocalizationProviderProps {
	readonly children?: JSX.Element;
	readonly localizations?: readonly Localization[];
}

export const LocalizationProvider = (props: LocalizationProviderProps) => {
	return (
		<localizationContext.Provider
			value={{
				localization: props.localizations?.[0] ?? null,
				localizations: props.localizations ?? [],
			}}
		>
			{props.children}
		</localizationContext.Provider>
	);
};
