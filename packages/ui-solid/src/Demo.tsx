import { EntryState, XFormDefinition } from '@odk-web-forms/xforms-engine';
import { createEffect, createMemo, createResource, createSignal, on, untrack } from 'solid-js';
import { App } from './App.tsx';
import { DemoFixturesList, type SelectedDemoFixture } from './components/Demo/DemoFixturesList.tsx';

export const Demo = () => {
	const [fixture, setFixture] = createSignal<SelectedDemoFixture | null>(null);
	const [fixtureSourceXML, { refetch }] = createResource(async () => {
		return await Promise.resolve(fixture()?.xml);
	});
	const entry = createMemo(() => {
		const sourceXML = fixtureSourceXML();

		if (sourceXML == null) {
			return null;
		}

		const definition = new XFormDefinition(sourceXML);

		return untrack(() => new EntryState(definition));
	});

	createEffect(
		on(fixture, async () => {
			await refetch();
		})
	);

	return <App extras={<DemoFixturesList setDemoFixture={setFixture} />} entry={entry()} />;
};
