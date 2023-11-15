import { Show, createSignal, createUniqueId } from 'solid-js';
import type { XFormEntry } from '../../../lib/xform/XFormEntry.ts';
import type { XFormEntryBinding } from '../../../lib/xform/XFormEntryBinding.ts';
import type { RepeatDefinition } from '../../../lib/xform/body/RepeatDefinition.ts';
import { TopLevelRepeatInstance } from '../../styled/TopLevelRepeatInstance.tsx';
import { XFormQuesetionList } from '../XFormQuestionList.tsx';
import { XFormRepeatInstanceLabel } from './XFormRepeatInstanceLabel.tsx';

interface XFormRepeatInstanceProps {
	readonly binding: XFormEntryBinding;
	readonly entry: XFormEntry;
	readonly repeat: RepeatDefinition;
}

export const XFormRepeatInstance = (props: XFormRepeatInstanceProps) => {
	const [isRepeatInstanceVisible, setRepeatInstanceVisible] = createSignal(true);
	const id = createUniqueId();

	return (
		<TopLevelRepeatInstance>
			<Show when={props.repeat.groupDefinition.label} keyed={true}>
				{(label) => (
					<XFormRepeatInstanceLabel
						id={id}
						binding={props.binding}
						label={label}
						isRepeatInstanceVisible={isRepeatInstanceVisible()}
						setRepeatInstanceVisible={setRepeatInstanceVisible}
					/>
				)}
			</Show>
			<Show when={isRepeatInstanceVisible()}>
				<XFormQuesetionList entry={props.entry} elements={props.repeat.children} />
			</Show>
		</TopLevelRepeatInstance>
	);
};
