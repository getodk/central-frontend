import { createMemo, createUniqueId } from 'solid-js';
import type { XFormEntryBinding } from '../../lib/xform/XFormEntryBinding.ts';
import type { XFormViewLabel } from '../../lib/xform/XFormViewLabel.ts';
import { XFormControlLabel } from '../XForm/controls/XFormControlLabel.tsx';
import { DefaultTextField } from '../styled/DefaultTextField.tsx';
import { DefaultTextFormControl } from '../styled/DefaultTextFormControl.tsx';

export interface TextWidgetProps {
	readonly label: XFormViewLabel | null;
	readonly ref: string | null;
	readonly binding: XFormEntryBinding | null;
}

export const TextWidget = (props: TextWidgetProps) => {
	const id = createUniqueId();
	const isDisabled = createMemo(() => {
		return props.binding?.isReadonly() === true || props.binding?.isRelevant() === false;
	});

	return (
		<DefaultTextFormControl fullWidth>
			<XFormControlLabel binding={props.binding} id={id} label={props.label} />
			<DefaultTextField
				id={id}
				value={props.binding?.getValue()}
				onChange={(event) => {
					props.binding?.setValue(event.target.value);
				}}
				disabled={isDisabled()}
				inputProps={{
					disabled: isDisabled(),
					readonly: isDisabled(),
					required: props.binding?.isRequired() ?? false,
				}}
			/>
		</DefaultTextFormControl>
	);
};
