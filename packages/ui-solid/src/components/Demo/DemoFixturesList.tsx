import type { XFormFixture } from '@getodk/common/fixtures/xforms.ts';
import { xformFixtures } from '@getodk/common/fixtures/xforms.ts';
import Assignment from '@suid/icons-material/Assignment';
import ChevronLeft from '@suid/icons-material/ChevronLeft';
import {
	Button,
	List,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	Stack,
	Typography,
	styled,
} from '@suid/material';
import { For, Show, createComputed, createSignal } from 'solid-js';

const DemoBackButton = styled(Button)(({ theme }) => ({
	marginBlockEnd: theme.spacing(2),
}));

interface DemoFixturesListProps {
	setDemoFixture(selected: XFormFixture | null): void;
}

export const DemoFixturesList = (props: DemoFixturesListProps) => {
	const [selectedFixture, setSelectedFixture] = createSignal<XFormFixture>();

	createComputed(() => {
		const fixture = selectedFixture();

		if (fixture == null) {
			props.setDemoFixture(null);

			return;
		}

		props.setDemoFixture(fixture ?? null);
	});

	return (
		<Show
			when={selectedFixture() == null}
			fallback={
				<DemoBackButton onClick={() => setSelectedFixture()}>
					<ChevronLeft />
					Demo forms
				</DemoBackButton>
			}
		>
			<Stack spacing={2}>
				<Typography variant="h1">Demo forms</Typography>
				<List>
					<For each={xformFixtures}>
						{(demoFixture) => (
							<ListItem>
								<ListItemButton
									onClick={() => {
										setSelectedFixture(demoFixture);
									}}
								>
									<ListItemIcon>
										<Assignment />
									</ListItemIcon>
									<ListItemText>
										{demoFixture.category} &rsaquo; {demoFixture.identifier}
									</ListItemText>
								</ListItemButton>
							</ListItem>
						)}
					</For>
				</List>
			</Stack>
		</Show>
	);
};
