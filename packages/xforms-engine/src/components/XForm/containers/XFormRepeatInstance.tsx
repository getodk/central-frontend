import { Show, createSignal } from 'solid-js';
import { Box, Stack, styled } from 'suid/material';
import type { RepeatInstanceState } from '../../../lib/xform/state/RepeatInstanceState.ts';
import { TopLevelRepeatInstance } from '../../styled/TopLevelRepeatInstance.tsx';
import { XFormQuestionList } from '../XFormQuestionList.tsx';
import { RepeatInstanceOptionsMenu } from './RepeatInstanceOptionsMenu.tsx';
import { XFormRepeatInstanceLabel } from './XFormRepeatInstanceLabel.tsx';

const RepeatInstanceOptionsMenuContainer = styled(Box)({
	marginInlineStart: 'auto',
});

interface XFormRepeatInstanceProps {
	readonly state: RepeatInstanceState;
}

export const XFormRepeatInstance = (props: XFormRepeatInstanceProps) => {
	const [isRepeatInstanceVisible, setRepeatInstanceVisible] = createSignal(true);
	const elementDefinition = () => props.state.definition.bodyElement;
	const labelDefinition = () =>
		elementDefinition().label ?? elementDefinition().groupDefinition.label;

	return (
		<TopLevelRepeatInstance>
			<Stack direction="row" justifyContent="space-between">
				<Show when={labelDefinition()} keyed={true}>
					{(label) => (
						<XFormRepeatInstanceLabel
							state={props.state}
							label={label}
							isRepeatInstanceVisible={isRepeatInstanceVisible()}
							setRepeatInstanceVisible={setRepeatInstanceVisible}
						/>
					)}
				</Show>
				<RepeatInstanceOptionsMenuContainer justifySelf="flex-end">
					<RepeatInstanceOptionsMenu state={props.state} />
				</RepeatInstanceOptionsMenuContainer>
			</Stack>
			<Show when={isRepeatInstanceVisible()}>
				<XFormQuestionList state={props.state} />
			</Show>
		</TopLevelRepeatInstance>
	);
};
