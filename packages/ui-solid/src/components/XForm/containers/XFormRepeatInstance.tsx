import type { RepeatInstanceNode, RepeatRangeNode } from '@getodk/xforms-engine';
import { Box, Stack, styled } from '@suid/material';
import { Show, createSignal } from 'solid-js';
import { TopLevelRepeatInstance } from '../../styled/TopLevelRepeatInstance.tsx';
import { XFormQuestionList } from '../XFormQuestionList.tsx';
import { RepeatInstanceOptionsMenu } from './RepeatInstanceOptionsMenu.tsx';
import { XFormRepeatInstanceLabel } from './XFormRepeatInstanceLabel.tsx';

const RepeatInstanceOptionsMenuContainer = styled(Box)({
	marginInlineStart: 'auto',
});

interface XFormRepeatInstanceProps {
	readonly index: number;
	readonly instance: RepeatInstanceNode;
}

export const XFormRepeatInstance = (props: XFormRepeatInstanceProps) => {
	const [isRepeatInstanceVisible, setRepeatInstanceVisible] = createSignal(true);
	const repeatLabel = () => {
		const { instance } = props;

		return instance.currentState.label ?? instance.parent.currentState.label;
	};
	const uncontrolledRepeatRange = (instance: RepeatInstanceNode): RepeatRangeNode | null => {
		const { parent } = instance;

		if (parent.countType === 'uncontrolled') {
			return parent;
		}

		return null;
	};

	return (
		<TopLevelRepeatInstance>
			<Stack direction="row" justifyContent="space-between">
				<Show when={repeatLabel()} keyed={true}>
					{(label) => (
						<XFormRepeatInstanceLabel
							node={props.instance}
							label={label}
							isRepeatInstanceVisible={isRepeatInstanceVisible()}
							setRepeatInstanceVisible={setRepeatInstanceVisible}
						/>
					)}
				</Show>
				<Show when={uncontrolledRepeatRange(props.instance)} keyed={true}>
					{(range) => {
						return (
							<RepeatInstanceOptionsMenuContainer justifySelf="flex-end">
								<RepeatInstanceOptionsMenu
									range={range}
									index={props.index}
									instance={props.instance}
								/>
							</RepeatInstanceOptionsMenuContainer>
						);
					}}
				</Show>
			</Stack>
			<Show when={isRepeatInstanceVisible()}>
				<XFormQuestionList node={props.instance} />
			</Show>
		</TopLevelRepeatInstance>
	);
};
