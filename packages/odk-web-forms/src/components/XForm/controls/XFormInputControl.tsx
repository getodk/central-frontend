import { Show } from 'solid-js';
import type { XFormViewControlType } from '../../../lib/xform/types.ts';
import { TextWidget } from '../../Widget/TextWidget.tsx';
import type { XFormControlProps } from '../XFormControl.tsx';
import { XFormUnlabeledControl } from '../debugging/XFormUnlabeledInputControl.tsx';

export type XFormInputControlProps = XFormControlProps<'input'>;

const isXFormInputControlProps = (
	props: XFormControlProps<XFormViewControlType>
): props is XFormInputControlProps => props.viewControl.type === 'input';

export const xFormInputControlProps = (
	props: XFormControlProps<XFormViewControlType>
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
				<XFormUnlabeledControl viewControl={props.viewControl} />
			</Show>
			<TextWidget label={props.viewControl.label} ref={props.viewControl.ref} />
		</>
	);
};
