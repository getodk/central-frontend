import { For, Show, createSignal, createUniqueId } from 'solid-js';
import type { XFormEntry } from '../../../lib/xform/XFormEntry.ts';
import type { XFormEntryBinding } from '../../../lib/xform/XFormEntryBinding.ts';
import { TopLevelRepeatInstance } from '../../styled/TopLevelRepeatInstance.tsx';
import type { XFormControlPropsViewControl } from '../XFormControl.tsx';
import { XFormControl } from '../XFormControl.tsx';
import { XFormControlStack } from '../XFormControlStack.tsx';
import { XFormRepeatInstanceLabel } from './XFormRepeatInstanceLabel.tsx';

interface XFormRepeatInstanceProps {
	readonly binding: XFormEntryBinding;
	readonly entry: XFormEntry;
	readonly viewControl: XFormControlPropsViewControl<'repeat'>;
}

export const XFormRepeatInstance = (props: XFormRepeatInstanceProps) => {
	const [isRepeatInstanceVisible, setRepeatInstanceVisible] = createSignal(true);
	const id = createUniqueId();

	return (
		<TopLevelRepeatInstance>
			<Show when={props.binding} keyed={true}>
				{(binding) => (
					<Show when={props.viewControl.label} keyed={true}>
						{(label) => (
							<XFormRepeatInstanceLabel
								id={id}
								binding={binding}
								label={label}
								isRepeatInstanceVisible={isRepeatInstanceVisible()}
								setRepeatInstanceVisible={setRepeatInstanceVisible}
							/>
						)}
					</Show>
				)}
			</Show>
			<Show when={isRepeatInstanceVisible()}>
				<XFormControlStack>
					<For each={props.viewControl.children}>
						{(child) => {
							return <XFormControl entry={props.entry} viewControl={child} />;
						}}
					</For>
				</XFormControlStack>
			</Show>
		</TopLevelRepeatInstance>
	);
};
