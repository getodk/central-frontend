import type { RepeatRangeNode } from '@getodk/xforms-engine';
import { Box, Stack } from '@suid/material';
import { For, getOwner, runWithOwner } from 'solid-js';
import { ThemeColorOutlineButton } from '../../styled/ThemeColorOutlineButton.tsx';
import { XFormRepeatInstance } from './XFormRepeatInstance.tsx';

interface XFormRepeatListProps {
	readonly node: RepeatRangeNode;
}

export const XFormRepeatList = (props: XFormRepeatListProps) => {
	const owner = getOwner();

	return (
		<Stack spacing={2}>
			<For each={props.node.currentState.children}>
				{(instance, index) => {
					return <XFormRepeatInstance index={index()} instance={instance} />;
				}}
			</For>
			<Box>
				<ThemeColorOutlineButton
					onClick={() => {
						runWithOwner(owner, () => {
							props.node.addInstances();
						});
					}}
				>
					+ Add
				</ThemeColorOutlineButton>
			</Box>
		</Stack>
	);
};
