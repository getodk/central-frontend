import type { AnyChildNode, TextRange } from '@getodk/xforms-engine';
import { Show } from 'solid-js';
import { DefaultLabel } from '../styled/DefaultLabel';
import { DefaultLabelRequiredIndicator } from '../styled/DefaultLabelRequiredIndicator';

export interface XFormLabelProps {
	readonly as?: 'span';
	readonly label: TextRange<'hint' | 'label'>;
	readonly node: AnyChildNode;
}

export const XFormLabel = (props: XFormLabelProps) => {
	return (
		<>
			<Show when={props.node.currentState.required}>
				<DefaultLabelRequiredIndicator>* </DefaultLabelRequiredIndicator>
			</Show>
			<DefaultLabel as={props.as ?? 'label'} for={props.node.nodeId}>
				{props.label.asString}
			</DefaultLabel>
		</>
	);
};
