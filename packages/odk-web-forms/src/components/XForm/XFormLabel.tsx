import { Show, createMemo } from 'solid-js';
import type { LabelDefinition } from '../../lib/xform/body/text/LabelDefinition';
import type { AnyNodeState } from '../../lib/xform/state/NodeState';
import { DefaultLabel } from '../styled/DefaultLabel';
import { DefaultLabelRequiredIndicator } from '../styled/DefaultLabelRequiredIndicator';

export interface XFormLabelProps {
	readonly as?: 'span';
	readonly state: AnyNodeState;
	readonly label: LabelDefinition;
}

export const XFormLabel = (props: XFormLabelProps) => {
	const modelNode = createMemo(() => {
		return props.state.node;
	});
	const evaluateParts = () => {
		return props.label.parts.map((part) => {
			return part.evaluate(props.state.entry.evaluator, modelNode());
		});
	};
	const labelValue = createMemo(() => {
		return {
			language: props.state.entry.translations?.getActiveLanguage(),
			text: evaluateParts().join(''),
		};
	});

	return (
		<>
			<Show when={props.state.isRequired()}>
				<DefaultLabelRequiredIndicator>* </DefaultLabelRequiredIndicator>
			</Show>
			<DefaultLabel as={props.as ?? 'label'} for={props.state.reference}>
				{labelValue().text}
			</DefaultLabel>
		</>
	);
};
