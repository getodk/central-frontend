import { XHTML_NAMESPACE_URI } from '@odk/common/constants/xmlns';
import { For, createComputed, createMemo, createSignal } from 'solid-js';
import Assignment from 'suid/icons-material/Assignment';
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText } from 'suid/material';

const formFixtureGlobImports = import.meta.glob('../../../fixtures/xforms/**/*.xml', {
	as: 'raw',
	eager: true,
});

export interface SelectedDemoFixture {
	readonly key: string;
	readonly name: string;
	readonly title: string;
	readonly url: string;
	readonly xml: string;
}

interface DemoFixturesListProps {
	setDemoFixture(selected: SelectedDemoFixture | null): void;
}

const domParser = new DOMParser();

export const DemoFixturesList = (props: DemoFixturesListProps) => {
	const [selectedFixtureKey, setSelectedFixtureKey] = createSignal<string>();

	const getFixtures = () => {
		const baseEntries = Object.entries(formFixtureGlobImports);

		const entries = baseEntries.map(([key, xml]): readonly [string, SelectedDemoFixture] => {
			const name = key.replace(/^.*\/([^/]+)$/, '$1');
			const url = import.meta.resolve(key, import.meta.url);
			const parsed: XMLDocument = domParser.parseFromString(xml, 'text/xml');
			const title =
				parsed.getElementsByTagNameNS(XHTML_NAMESPACE_URI, 'title')[0]?.textContent ?? name;

			return [
				key,
				{
					key,
					name,
					title,
					url,
					xml,
				} as const,
			];
		});

		return new Map(entries);
	};

	const isDemoFixture = (fixtureKey: string) =>
		fixtureKey.includes('/computations-demo/') || fixtureKey.includes('/repeats/');

	const demoFixtures = createMemo(() =>
		Array.from(getFixtures().values()).filter(({ key }) => isDemoFixture(key))
	);

	createComputed(() => {
		const key = selectedFixtureKey();
		const fixtures = getFixtures();

		if (key == null) {
			props.setDemoFixture(null);

			return;
		}

		const fixture = fixtures.get(key);

		props.setDemoFixture(fixture ?? null);
	});

	return (
		<List>
			<For each={demoFixtures()}>
				{(demoFixture) => (
					<ListItem>
						<ListItemButton
							onClick={() => {
								setSelectedFixtureKey(demoFixture.key);
							}}
						>
							<ListItemIcon>
								<Assignment />
							</ListItemIcon>
							<ListItemText>{demoFixture.title}</ListItemText>
						</ListItemButton>
					</ListItem>
				)}
			</For>
		</List>
	);
};
