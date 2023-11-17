import { For, createMemo } from 'solid-js';
import { Stack } from 'suid/material';
import type { RepeatDefinition } from '../../../lib/xform/body/RepeatDefinition.ts';
import type { EntryState } from '../../../lib/xform/state/EntryState.ts';
import { XFormRepeatInstance } from './XFormRepeatInstance.tsx';

interface XFormRepeatListProps {
	readonly entry: EntryState;
	readonly repeat: RepeatDefinition;
}

export const XFormRepeatList = (props: XFormRepeatListProps) => {
	const repeatInstanceBindings = createMemo(() => {
		const singleBindingTemp = props.entry.getBinding(props.repeat.reference);

		if (singleBindingTemp == null) {
			return [];
		}

		return [singleBindingTemp];
	});

	return (
		<Stack spacing={2}>
			<For each={repeatInstanceBindings()}>
				{(binding) => {
					return (
						<XFormRepeatInstance binding={binding} entry={props.entry} repeat={props.repeat} />
					);
				}}
			</For>
		</Stack>
	);
};
