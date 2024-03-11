import type { InputDefinition, ValueNodeState } from '@odk-web-forms/xforms-engine';
import { Show } from 'solid-js';
import { TextWidget } from '../../Widget/TextWidget.tsx';
import { XFormUnlabeledControl } from '../debugging/XFormUnlabeledInputControl.tsx';

interface XFormInputControlProps {
	readonly control: InputDefinition;
	readonly state: ValueNodeState;
}

export const XFormInputControl = (props: XFormInputControlProps) => {
	return (
		<>
			<Show when={props.control.label == null}>
				<XFormUnlabeledControl control={props.control} />
			</Show>
			<TextWidget control={props.control} state={props.state} />
		</>
	);
};
