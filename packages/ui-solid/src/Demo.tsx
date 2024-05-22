import { initializeForm } from '@getodk/xforms-engine';
import { createEffect, createMemo, createResource, createSignal, on } from 'solid-js';
import { createMutable } from 'solid-js/store';
import { App } from './App.tsx';
import { DemoFixturesList, type SelectedDemoFixture } from './components/Demo/DemoFixturesList.tsx';

export const Demo = () => {
	const [fixture, setFixture] = createSignal<SelectedDemoFixture | null>(null);
	const [fixtureForm, { refetch }] = createResource(async () => {
		const sourceXML = fixture()?.xml;

		if (sourceXML != null) {
			return initializeForm(sourceXML, {
				config: {
					stateFactory: createMutable,
				},
			});
		}

		return null;
	});
	const entry = createMemo(() => {
		return fixtureForm() ?? null;
	});

	createEffect(
		on(fixture, async () => {
			await refetch();
		})
	);

	return <App extras={<DemoFixturesList setDemoFixture={setFixture} />} root={entry()} />;
};
