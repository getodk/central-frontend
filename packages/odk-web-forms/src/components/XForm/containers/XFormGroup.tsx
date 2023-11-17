import { For, Show, createMemo, createSignal, createUniqueId } from 'solid-js';
import type { XFormViewChildType } from '../../../lib/xform/XFormViewChild.ts';
import { NestedGroupBox } from '../../styled/NestedGroupBox.tsx';
import { XFormControl, type XFormControlProps } from '../XFormControl.tsx';
import { XFormControlStack } from '../XFormControlStack.tsx';
import { XFormGroupLabel } from './XFormGroupLabel.tsx';

export type XFormGroupProps = XFormControlProps<'group'>;

const isXFormGroupProps = (
	props: XFormControlProps<XFormViewChildType>
): props is XFormGroupProps => props.viewControl.type === 'group';

export const xFormGroupProps = (
	props: XFormControlProps<XFormViewChildType>
): XFormGroupProps | null => {
	if (isXFormGroupProps(props)) {
		return props;
	}

	return null;
};

export const XFormGroup = (props: XFormGroupProps) => {
	const groupBinding = createMemo(() => props.entry.getViewBinding(props.viewControl));
	const [isGroupVisible, setGroupVisible] = createSignal(true);
	const id = createUniqueId();

	return (
		<NestedGroupBox as="section">
			<Show when={groupBinding()} keyed={true}>
				{(binding) => (
					<Show when={props.viewControl.label} keyed={true}>
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
				<XFormControlStack>
					<For each={props.viewControl.children}>
						{(child) => {
							return <XFormControl entry={props.entry} viewControl={child} />;
						}}
					</For>
				</XFormControlStack>
			</Show>
		</NestedGroupBox>
	);
};
