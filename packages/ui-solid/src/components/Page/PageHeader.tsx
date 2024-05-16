import type { RootNode } from '@getodk/xforms-engine';
import { Stack } from '@suid/material';
import { Show } from 'solid-js';
import { FormLanguageMenu } from '../FormLanguageMenu.tsx';

interface PageHeaderProps {
	readonly root: RootNode | null;
}

export const PageHeader = (props: PageHeaderProps) => {
	return (
		<Show when={props.root} keyed={true}>
			{(root) => {
				return (
					<Stack direction="row" justifyContent="flex-end">
						<FormLanguageMenu root={root} />
					</Stack>
				);
			}}
		</Show>
	);
};
