import type { GroupNode, RepeatRangeNode } from '@getodk/xforms-engine';
import { Match, Show, Switch, createMemo, createSignal } from 'solid-js';
import { NestedGroupBox } from '../../styled/NestedGroupBox.tsx';
import { XFormQuestionList } from '../XFormQuestionList.tsx';
import { XFormRelevanceGuard } from '../XFormRelevanceGuard.tsx';
import { XFormGroupLabel } from './XFormGroupLabel.tsx';
import { XFormRepeatList } from './XFormRepeatList.tsx';

export interface XFormGroupProps {
	readonly node: GroupNode | RepeatRangeNode;
}

const repeatNode = (node: GroupNode | RepeatRangeNode): RepeatRangeNode | null => {
	if (node.nodeType === 'repeat-range') {
		return node;
	}

	return null;
};

const groupNode = (node: GroupNode | RepeatRangeNode): GroupNode | null => {
	if (node.nodeType === 'group') {
		return node;
	}

	return null;
};

export const XFormGroup = (props: XFormGroupProps) => {
	const groupLabel = () => {
		if (props.node.nodeType === 'repeat-range') {
			return null;
		}

		return props.node.currentState.label;
	};
	const isRelevant = createMemo(() => {
		return props.node.currentState.relevant;
	});
	const [isGroupVisible, setGroupVisible] = createSignal(true);

	return (
		<XFormRelevanceGuard isRelevant={isRelevant()}>
			<Show when={groupLabel()} keyed={true}>
				{(label) => (
					<XFormGroupLabel
						node={props.node}
						label={label}
						isGroupVisible={isGroupVisible()}
						setGroupVisible={setGroupVisible}
					/>
				)}
			</Show>
			<Show when={isGroupVisible()}>
				<Switch>
					<Match when={repeatNode(props.node)} keyed={true}>
						{(node) => {
							return <XFormRepeatList node={node} />;
						}}
					</Match>
					<Match when={groupNode(props.node)} keyed={true}>
						{(node) => {
							return (
								<NestedGroupBox as="section">
									<XFormQuestionList node={node} />
								</NestedGroupBox>
							);
						}}
					</Match>
				</Switch>
			</Show>
		</XFormRelevanceGuard>
	);
};
