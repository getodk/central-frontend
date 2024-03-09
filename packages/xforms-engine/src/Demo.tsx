import { createEffect, createMemo, createResource, createSignal, on, untrack } from 'solid-js';
import { App } from './App.tsx';
import { DemoFixturesList, type SelectedDemoFixture } from './components/Demo/DemoFixturesList.tsx';
import { XFormDefinition } from './lib/xform/XFormDefinition.ts';
import { EntryState } from './lib/xform/state/EntryState.ts';

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
