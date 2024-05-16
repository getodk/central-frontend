import type { RootNode } from '@getodk/xforms-engine';
import { Divider, Stack } from '@suid/material';
import { Show, type JSX } from 'solid-js';
import { Page } from './components/Page/Page.tsx';
import { ThemeProvider } from './components/ThemeProvider.tsx';
import { XFormDetails } from './components/XForm/XFormDetails.tsx';
import { XFormView } from './components/XForm/XFormView.tsx';

interface AppProps {
	readonly extras?: JSX.Element;
	readonly root: RootNode | null;
}

export const App = (props: AppProps) => {
	return (
		<ThemeProvider>
			<Page root={props.root}>
				{props.extras}
				<Show when={props.root} keyed={true}>
					{(root) => {
						return (
							<Stack spacing={4}>
								<Stack spacing={7}>
									<XFormView root={root} />
									<Divider />
									<XFormDetails root={root} />
								</Stack>
							</Stack>
						);
					}}
				</Show>
			</Page>
		</ThemeProvider>
	);
};
