import { createUniqueId } from 'solid-js';
import { Show } from 'solid-js/web';
import { DefaultLabel } from '../styled/DefaultLabel.tsx';
import { DefaultLabelParagraph } from '../styled/DefaultLabelParagraph.tsx';
import { DefaultTextField } from '../styled/DefaultTextField.tsx';
import { DefaultTextFormControl } from '../styled/DefaultTextFormControl.tsx';

export interface TextWidgetProps {
	readonly label: string | null;
	readonly ref: string;
}

export const TextWidget = (props: TextWidgetProps) => {
	const id = createUniqueId();

	return (
		<DefaultTextFormControl fullWidth>
			<Show when={props.label} keyed={true}>
				{(label) => (
					<DefaultLabelParagraph>
						<DefaultLabel for={id}>{label}</DefaultLabel>
					</DefaultLabelParagraph>
				)}
			</Show>
			<DefaultTextField id={id} />
		</DefaultTextFormControl>
	);
};
