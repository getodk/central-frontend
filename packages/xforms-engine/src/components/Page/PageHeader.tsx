import { Show } from 'solid-js';
import { Stack } from 'suid/material';
import type { EntryState } from '../../lib/xform/state/EntryState.ts';
import { FormLanguageMenu } from '../FormLanguageMenu.tsx';

interface PageHeaderProps {
	readonly entry: EntryState | null;
}

export const PageHeader = (props: PageHeaderProps) => {
	return (
		<Show when={props.entry?.translations} keyed={true}>
			{(translations) => {
				return (
					<Stack direction="row" justifyContent="flex-end">
						<FormLanguageMenu translations={translations} />
					</Stack>
				);
			}}
		</Show>
	);
};
