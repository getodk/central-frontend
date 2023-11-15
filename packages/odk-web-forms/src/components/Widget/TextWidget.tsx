import { Show, createMemo, createUniqueId } from 'solid-js';
import type { XFormEntryBinding } from '../../lib/xform/XFormEntryBinding.ts';
import type { InputDefinition } from '../../lib/xform/body/control/InputDefinition.ts';
import { XFormControlLabel } from '../XForm/controls/XFormControlLabel.tsx';
import { DefaultTextField } from '../styled/DefaultTextField.tsx';
import { DefaultTextFormControl } from '../styled/DefaultTextFormControl.tsx';

export interface TextWidgetProps {
	readonly binding: XFormEntryBinding | null;
	readonly input: InputDefinition;
}

export const TextWidget = (props: TextWidgetProps) => {
	const id = createUniqueId();

	return (
		<Show when={props.binding} keyed={true}>
			{(binding) => {
				const isDisabled = createMemo(() => {
					return binding.isReadonly() === true || binding.isRelevant() === false;
				});

				return (
					<DefaultTextFormControl fullWidth={true}>
						<Show when={props.input.label} keyed={true}>
							{(label) => {
								return <XFormControlLabel id={id} binding={binding} label={label} />;
							}}
						</Show>
						<DefaultTextField
							id={id}
							value={binding.getValue()}
							onChange={(event) => {
								binding.setValue(event.target.value);
							}}
							disabled={isDisabled()}
							inputProps={{
								disabled: isDisabled(),
								readonly: isDisabled(),
								required: binding.isRequired() ?? false,
							}}
						/>
					</DefaultTextFormControl>
				);
			}}
		</Show>
	);
};
