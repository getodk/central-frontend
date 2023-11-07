import { Show } from 'solid-js';
import type { XFormEntryBinding } from '../../../lib/xform/XFormEntryBinding.ts';
import type { XFormViewLabel } from '../../../lib/xform/XFormViewLabel.ts';
import { DefaultLabel } from '../../styled/DefaultLabel.tsx';
import { DefaultLabelParagraph } from '../../styled/DefaultLabelParagraph.tsx';
import { DefaultLabelRequiredIndicator } from '../../styled/DefaultLabelRequiredIndicator.tsx';

interface XFormControlLabelProps {
	readonly binding: XFormEntryBinding | null;
	readonly id: string;
	readonly label: XFormViewLabel | null;
}

export const XFormControlLabel = (props: XFormControlLabelProps) => {
	return (
		<Show when={props.label} keyed={true}>
			{(label) => (
				<DefaultLabelParagraph>
					<Show when={props.binding?.isRequired()}>
						<DefaultLabelRequiredIndicator>* </DefaultLabelRequiredIndicator>
					</Show>
					<DefaultLabel for={props.id}>{label.labelText}</DefaultLabel>
				</DefaultLabelParagraph>
			)}
		</Show>
	);
};
