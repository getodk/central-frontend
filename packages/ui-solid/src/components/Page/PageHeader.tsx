import type { EntryState } from '@odk-web-forms/xforms-engine';
import { Stack } from '@suid/material';
import { Show } from 'solid-js';
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
