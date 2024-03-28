import type { GroupNode, RepeatRangeNode } from '@odk-web-forms/xforms-engine';
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
	if (node.definition.type === 'repeat-sequence') {
		// TODO: this isn't narrowing the union as it did previously...
		return node as RepeatRangeNode;
	}

	return null;
};

const nonRepeatNode = (state: GroupNode | RepeatRangeNode): GroupNode | null => {
	if (state.definition.type === 'repeat-sequence') {
		return null;
	}

	// TODO: also not narrowing the union as it did previously...
	return state as GroupNode;
};

export const XFormGroup = (props: XFormGroupProps) => {
	const groupLabel = () => {
		if (props.node.definition.type === 'repeat-sequence') {
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
					<Match when={nonRepeatNode(props.node)} keyed={true}>
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
