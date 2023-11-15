import { For, Show, createMemo } from 'solid-js';
import type { XFormEntryBinding } from '../../lib/xform/XFormEntryBinding';
import type { LabelDefinition } from '../../lib/xform/body/text/LabelDefinition';
import { DefaultLabel } from '../styled/DefaultLabel';
import { DefaultLabelRequiredIndicator } from '../styled/DefaultLabelRequiredIndicator';

export interface XFormLabelProps {
	readonly as?: 'span';
	readonly binding: XFormEntryBinding;
	readonly id: string;
	readonly label: LabelDefinition;
}

export const XFormLabel = (props: XFormLabelProps) => {
	const modelElement = createMemo(() => {
		return props.binding.getModelElement();
	});

	return (
		<>
			<Show when={props.binding.isRequired()}>
				<DefaultLabelRequiredIndicator>* </DefaultLabelRequiredIndicator>
			</Show>
			<DefaultLabel as={props.as ?? 'label'} for={props.id}>
				<For each={props.label.parts}>
					{(part) => {
						console.log('eval output? model el', modelElement());
						return part.evaluate(props.binding.evaluator, modelElement());
					}}
				</For>
			</DefaultLabel>
		</>
	);
};
