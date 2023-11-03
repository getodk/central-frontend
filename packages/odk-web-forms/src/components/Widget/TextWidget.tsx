import { createUniqueId } from 'solid-js';
import { Show } from 'solid-js/web';
import type { XFormEntryBinding } from '../../lib/xform/XFormEntryBinding.ts';
import type { XFormViewLabel } from '../../lib/xform/XFormViewLabel.ts';
import { DefaultLabel } from '../styled/DefaultLabel.tsx';
import { DefaultLabelParagraph } from '../styled/DefaultLabelParagraph.tsx';
import { DefaultTextField } from '../styled/DefaultTextField.tsx';
import { DefaultTextFormControl } from '../styled/DefaultTextFormControl.tsx';

export interface TextWidgetProps {
	readonly label: XFormViewLabel | null;
	readonly ref: string | null;
	readonly binding: XFormEntryBinding | null;
}

export const TextWidget = (props: TextWidgetProps) => {
	const id = createUniqueId();

	return (
		<DefaultTextFormControl fullWidth>
			<Show when={props.label} keyed={true}>
				{(label) => (
					<DefaultLabelParagraph>
						<DefaultLabel for={id}>{label.labelText}</DefaultLabel>
					</DefaultLabelParagraph>
				)}
			</Show>
			<DefaultTextField
				id={id}
				value={props.binding?.getValue()}
				onChange={(event) => {
					props.binding?.setValue(event.target.value);
				}}
			/>
		</DefaultTextFormControl>
	);
};
