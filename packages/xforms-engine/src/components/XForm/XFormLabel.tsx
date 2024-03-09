import { Show } from 'solid-js';
import type { LabelDefinition } from '../../lib/xform/body/text/LabelDefinition';
import type { AnyDescandantNodeState } from '../../lib/xform/state/DescendantNodeState';
import { DefaultLabel } from '../styled/DefaultLabel';
import { DefaultLabelRequiredIndicator } from '../styled/DefaultLabelRequiredIndicator';

export interface XFormLabelProps {
	readonly as?: 'span';
	readonly state: AnyDescandantNodeState;
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
