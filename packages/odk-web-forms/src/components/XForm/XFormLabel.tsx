import { Show } from 'solid-js';
import type { XFormEntryBinding } from '../../lib/xform/XFormEntryBinding';
import type { XFormViewLabel } from '../../lib/xform/XFormViewLabel';
import { DefaultLabel } from '../styled/DefaultLabel';
import { DefaultLabelRequiredIndicator } from '../styled/DefaultLabelRequiredIndicator';

export interface XFormLabelProps {
	readonly as?: 'span';
	readonly binding: XFormEntryBinding;
	readonly id: string;
	readonly label: XFormViewLabel;
}

export const XFormLabel = (props: XFormLabelProps) => {
	return (
		<>
			<Show when={props.binding.isRequired()}>
				<DefaultLabelRequiredIndicator>* </DefaultLabelRequiredIndicator>
			</Show>
			<DefaultLabel as={props.as ?? 'label'} for={props.id}>
				{props.label.labelText}
			</DefaultLabel>
		</>
	);
};
