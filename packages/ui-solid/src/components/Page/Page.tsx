import type { RootNode } from '@getodk/xforms-engine';
import { GlobalStyles, Stack, useTheme } from '@suid/material';
import type { JSX } from 'solid-js';
import { PageContainer } from '../styled/PageContainer.tsx';
import { PageFooter } from './PageFooter.tsx';
import { PageHeader } from './PageHeader.tsx';
import { PageMain } from './PageMain.tsx';

interface PageProps {
	readonly children?: JSX.Element;
	readonly root: RootNode | null;
}

export const Page = (props: PageProps) => {
	const theme = useTheme();

	return (
		<>
			<GlobalStyles
				styles={{
					'html, body': {
						fontFamily: 'sans-serif',
					},

					'html, body, #root, #root > .MuiContainer-root': {
						display: 'block',
						position: 'relative',
						height: '100%',
						backgroundColor: `var(--page-background, ${theme.palette.background.default})`,
					},

					'html, body, #root': {
						width: '100%',
						margin: '0',
						padding: '0',
					},
				}}
			/>
			<PageContainer>
				<Stack spacing={2}>
					<PageHeader root={props.root} />
					<PageMain elevation={2}>{props.children}</PageMain>
					<PageFooter />
				</Stack>
			</PageContainer>
		</>
	);
};
