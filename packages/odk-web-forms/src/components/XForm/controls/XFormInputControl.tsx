import { Show, createMemo } from 'solid-js';
import type { XFormEntry } from '../../../lib/xform/XFormEntry.ts';
import { InputDefinition } from '../../../lib/xform/body/control/InputDefinition.ts';
import { TextWidget } from '../../Widget/TextWidget.tsx';
import { XFormUnlabeledControl } from '../debugging/XFormUnlabeledInputControl.tsx';
import type { XFormControlProps } from './XFormControl.tsx';

interface XFormInputControlProps {
	readonly entry: XFormEntry;
	readonly control: InputDefinition;
}

export const inputControlProps = (props: XFormControlProps): XFormInputControlProps | null => {
	if (props.control instanceof InputDefinition) {
		return props;
	}

	return null;
};

export const XFormInputControl = (props: XFormInputControlProps) => {
	const binding = createMemo(() => {
		return props.control.getBinding(props.entry);
	});

	return (
		<>
			<Show when={props.control.label == null}>
				<XFormUnlabeledControl control={props.control} />
			</Show>
			<TextWidget binding={binding()} input={props.control} />
		</>
	);
};
