import type { StringNode } from '@getodk/xforms-engine';
import { Show, createMemo } from 'solid-js';
import { XFormControlLabel } from '../XForm/controls/XFormControlLabel.tsx';
import { DefaultTextField } from '../styled/DefaultTextField.tsx';
import { DefaultTextFormControl } from '../styled/DefaultTextFormControl.tsx';

export interface TextWidgetProps {
	readonly node: StringNode;
}

export const TextWidget = (props: TextWidgetProps) => {
	const isDisabled = createMemo(() => {
		return props.node.currentState.readonly || !props.node.currentState.relevant;
	});

	return (
		<DefaultTextFormControl fullWidth={true}>
			<Show when={props.node.currentState.label} keyed={true}>
				{(label) => {
					return <XFormControlLabel node={props.node} label={label} />;
				}}
			</Show>
			<DefaultTextField
				id={props.node.currentState.reference}
				value={props.node.currentState.value}
				onChange={(event) => {
					props.node.setValue(event.target.value);
				}}
				disabled={isDisabled()}
				inputProps={{
					disabled: isDisabled(),
					readonly: isDisabled(),
					required: props.node.currentState.required ?? false,
				}}
			/>
		</DefaultTextFormControl>
	);
};
