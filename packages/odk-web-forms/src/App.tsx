import { Show, Suspense, createResource } from 'solid-js';
import { Divider, Stack } from 'suid/material';
import { LocalizationProvider } from './components/LocalizationProvider.tsx';
import { Page } from './components/Page/Page.tsx';
import { ThemeProvider } from './components/ThemeProvider.tsx';
import { XFormDetails } from './components/XForm/XFormDetails.tsx';
import { XFormView } from './components/XForm/XFormView.tsx';
import type { Localization } from './lib/i18n-l10n/types.ts';
import { XFormDefinition } from './lib/xform/XFormDefinition.ts';

// TODO: this is just to populate the menu for now
const localizations: readonly Localization[] = [
	{
		locale: 'en-us',
		name: 'English (US)',
	},
	{
		locale: 'es',
		name: 'Spanish',
	},
];

export const App = () => {
	const [xformDefinition] = createResource(async () => {
		const { default: xml } = await import('../fixtures/xforms/minimal.xform.xml?raw');

		return XFormDefinition.fromSourceXML(xml);
	});

	return (
		<ThemeProvider>
			<LocalizationProvider localizations={localizations}>
				<Page>
					<Suspense fallback={<p>Loading…</p>}>
						<Show when={xformDefinition()} keyed={true}>
							{(definition) => (
								<Stack spacing={7}>
									<XFormView definition={definition} />
									<Divider />
									<XFormDetails definition={definition} />
								</Stack>
							)}
						</Show>
					</Suspense>
				</Page>
			</LocalizationProvider>
		</ThemeProvider>
	);
};
