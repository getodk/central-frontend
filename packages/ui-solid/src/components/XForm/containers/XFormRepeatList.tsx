import type { RepeatRangeNode, RepeatRangeUncontrolledNode } from '@getodk/xforms-engine';
import { Box, Stack } from '@suid/material';
import { createMemo, For, getOwner, runWithOwner, Show } from 'solid-js';
import { ThemeColorOutlineButton } from '../../styled/ThemeColorOutlineButton.tsx';
import { XFormRepeatInstance } from './XFormRepeatInstance.tsx';

interface XFormRepeatListProps {
	readonly node: RepeatRangeNode;
}

export const XFormRepeatList = (props: XFormRepeatListProps) => {
	const uncontrolledRange = createMemo((): RepeatRangeUncontrolledNode | null => {
		const { node } = props;

		if (node.nodeType === 'repeat-range:uncontrolled') {
			return node;
		}

		return null;
	});
	const owner = getOwner();

	return (
		<Stack spacing={2}>
			<For each={props.node.currentState.children}>
				{(instance, index) => {
					return <XFormRepeatInstance index={index()} instance={instance} />;
				}}
			</For>
			<Show when={uncontrolledRange()} keyed={true}>
				{(range) => {
					return (
						<Box>
							<ThemeColorOutlineButton
								onClick={() => {
									runWithOwner(owner, () => {
										range.addInstances();
									});
								}}
							>
								+ Add
							</ThemeColorOutlineButton>
						</Box>
					);
				}}
			</Show>
		</Stack>
	);
};
