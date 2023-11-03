import { Show } from 'solid-js';
import type { XFormViewChildType } from '../../../lib/xform/XFormViewChild.ts';
import { TextWidget } from '../../Widget/TextWidget.tsx';
import type { XFormControlProps } from '../XFormControl.tsx';
import { XFormUnlabeledControl } from '../debugging/XFormUnlabeledInputControl.tsx';

export type XFormInputControlProps = XFormControlProps<'input'>;

const isXFormInputControlProps = (
	props: XFormControlProps<XFormViewChildType>
): props is XFormInputControlProps => props.viewControl.type === 'input';

export const xFormInputControlProps = (
	props: XFormControlProps<XFormViewChildType>
): XFormInputControlProps | null => {
	if (isXFormInputControlProps(props)) {
		return props;
	}

	return null;
};

export const XFormInputControl = (props: XFormInputControlProps) => {
	return (
		<>
			<Show when={props.viewControl.label == null}>
				<XFormUnlabeledControl entry={props.entry} viewControl={props.viewControl} />
			</Show>
			<TextWidget
				label={props.viewControl.label}
				ref={props.viewControl.ref}
				bindState={
					props.viewControl.ref == null ? null : props.entry.get(props.viewControl.ref) ?? null
				}
			/>
		</>
	);
};
