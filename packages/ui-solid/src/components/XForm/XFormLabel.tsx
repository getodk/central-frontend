import type { AnyDescendantNodeState, LabelDefinition } from '@odk-web-forms/xforms-engine';
import { Show } from 'solid-js';
import { DefaultLabel } from '../styled/DefaultLabel';
import { DefaultLabelRequiredIndicator } from '../styled/DefaultLabelRequiredIndicator';

export interface XFormLabelProps {
	readonly as?: 'span';
	readonly state: AnyDescendantNodeState;
	readonly label: LabelDefinition;
}

export const XFormLabel = (props: XFormLabelProps) => {
	const labelText = props.state.createTextEvaluation(props.label);

	return (
		<>
			<Show when={props.state.isRequired()}>
				<DefaultLabelRequiredIndicator>* </DefaultLabelRequiredIndicator>
			</Show>
			<DefaultLabel as={props.as ?? 'label'} for={props.state.reference}>
				{labelText()}
			</DefaultLabel>
		</>
	);
};
