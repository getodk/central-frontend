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
	// A resource (Solid's mechanism for data fetching and triggering Suspense) is a
	// likely way we'll fetch forms, so using it here to anticipate that rather than
	// importing the fixture directly.
	//
	// TODO: more fixtures are likely incoming rather soon, it'll make sense to have
	// an app entry to correspond to that, and allow selection of particular fixtures,
	// perhaps arbitrary forms as well.
	const [fixtureSourceXML] = createResource(async () => {
		const { default: fixtureSource } = await import(
			'../fixtures/xforms/basic-calculate.xform.xml?raw'
		);

		return fixtureSource;
	});

	return (
		<ThemeProvider>
			<LocalizationProvider localizations={localizations}>
				<Page>
					<Suspense fallback={<p>Loading…</p>}>
						<Show when={fixtureSourceXML()} keyed={true}>
							{(sourceXML) => {
								const definition = new XFormDefinition(sourceXML);

								return (
									<Stack spacing={7}>
										<XFormView definition={definition} />
										<Divider />
										<XFormDetails definition={definition} />
									</Stack>
								);
							}}
						</Show>
					</Suspense>
				</Page>
			</LocalizationProvider>
		</ThemeProvider>
	);
};
