import type { XFormFixture } from '@getodk/common/fixtures/xforms.ts';
import { initializeForm } from '@getodk/xforms-engine';
import { createEffect, createMemo, createResource, createSignal, on } from 'solid-js';
import { createMutable } from 'solid-js/store';
import { App } from './App.tsx';
import { DemoFixturesList } from './components/Demo/DemoFixturesList.tsx';

export const Demo = () => {
	const [fixture, setFixture] = createSignal<XFormFixture | null>(null);
	const [fixtureForm, { refetch }] = createResource(async () => {
		const sourceXML = await fixture()?.loadXML();

		if (sourceXML != null) {
			return initializeForm(sourceXML, {
				config: {
					stateFactory: createMutable,
				},
			});
		}

		return null;
	});
	const root = createMemo(() => {
		return fixtureForm() ?? null;
	});

	createEffect(
		on(fixture, async () => {
			await refetch();
		})
	);

	return <App extras={<DemoFixturesList setDemoFixture={setFixture} />} root={root()} />;
};
