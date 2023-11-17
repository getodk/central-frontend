import { Match, Show, Switch, createMemo, createSignal, createUniqueId } from 'solid-js';
import type { AnyGroupElementDefinition } from '../../../lib/xform/body/BodyDefinition.ts';
import { nonRepeatGroup, repeatGroup } from '../../../lib/xform/body/group/BaseGroupDefinition.ts';
import type { EntryState } from '../../../lib/xform/state/EntryState.ts';
import { NestedGroupBox } from '../../styled/NestedGroupBox.tsx';
import { XFormQuesetionList } from '../XFormQuestionList.tsx';
import { XFormRelevanceGuard } from '../XFormRelevanceGuard.tsx';
import { XFormGroupLabel } from './XFormGroupLabel.tsx';
import { XFormRepeatList } from './XFormRepeatList.tsx';

export interface XFormGroupProps {
	readonly entry: EntryState;
	readonly group: AnyGroupElementDefinition;
}

export const XFormGroup = (props: XFormGroupProps) => {
	const isRelevant = createMemo(() => {
		return props.group.getBinding(props.entry)?.isRelevant() ?? true;
	});
	const [isGroupVisible, setGroupVisible] = createSignal(true);
	const id = createUniqueId();

	return (
		<XFormRelevanceGuard isRelevant={isRelevant()}>
			<NestedGroupBox as="section">
				<Show when={props.group.getBinding(props.entry)} keyed={true}>
					{(binding) => (
						<Show when={props.group.type !== 'repeat-group' && props.group.label} keyed={true}>
							{(label) => (
								<XFormGroupLabel
									id={id}
									binding={binding}
									label={label}
									isGroupVisible={isGroupVisible()}
									setGroupVisible={setGroupVisible}
								/>
							)}
						</Show>
					)}
				</Show>
				<Show when={isGroupVisible()}>
					<Switch>
						<Match when={repeatGroup(props.group)} keyed={true}>
							{(group) => {
								return <XFormRepeatList entry={props.entry} repeat={group.repeat} />;
							}}
						</Match>
						<Match when={nonRepeatGroup(props.group)} keyed={true}>
							{(group) => {
								return <XFormQuesetionList entry={props.entry} elements={group.children} />;
							}}
						</Match>
					</Switch>
					<XFormQuesetionList entry={props.entry} elements={props.group.children} />
				</Show>
			</NestedGroupBox>
		</XFormRelevanceGuard>
	);
};
