import { For, getOwner, runWithOwner } from 'solid-js';
import { Box, Stack } from 'suid/material';
import type { RepeatSequenceState } from '../../../lib/xform/state/RepeatSequenceState.ts';
import { ThemeColorOutlineButton } from '../../styled/ThemeColorOutlineButton.tsx';
import { XFormRepeatInstance } from './XFormRepeatInstance.tsx';

interface XFormRepeatListProps {
	readonly state: RepeatSequenceState;
}

export const XFormRepeatList = (props: XFormRepeatListProps) => {
	const owner = getOwner();

	return (
		<Stack spacing={2}>
			<For each={props.state.getInstances()}>
				{(instance) => {
					return <XFormRepeatInstance state={instance} />;
				}}
			</For>
			<Box>
				<ThemeColorOutlineButton
					onClick={() => {
						runWithOwner(owner, () => {
							props.state.createInstance();
						});
					}}
				>
					+ Add
				</ThemeColorOutlineButton>
			</Box>
		</Stack>
	);
};
