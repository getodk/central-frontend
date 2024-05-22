import type { SelectItem, SelectNode } from '@getodk/xforms-engine';
import { Checkbox, FormControlLabel, FormGroup } from '@suid/material';
import { For, Show, createMemo } from 'solid-js';
import type { SelectNDefinition } from '../XForm/controls/SelectControl.tsx';
import { XFormControlLabel } from '../XForm/controls/XFormControlLabel.tsx';

/**
 * @todo This should have a variant type in the engine's client interface.
 */
export interface MultiSelectProps {
	readonly control: SelectNDefinition;
	readonly node: SelectNode;
}

export const MultiSelect = (props: MultiSelectProps) => {
	const isDisabled = createMemo(() => {
		return props.node.currentState.readonly || !props.node.currentState.relevant;
	});

	const isSelected = (item: SelectItem) => {
		return props.node.currentState.value.includes(item);
	};

	return (
		<FormGroup role="group">
			<Show when={props.node.currentState.label} keyed={true}>
				{(label) => {
					return <XFormControlLabel node={props.node} label={label} />;
				}}
			</Show>
			<For each={props.node.currentState.valueOptions}>
				{(item) => {
					const label = () => item.label?.asString ?? item.value;

					return (
						<FormControlLabel
							label={label()}
							disabled={isDisabled()}
							control={
								<Checkbox
									checked={isSelected(item)}
									onChange={(_, checked) => {
										if (checked) {
											props.node.select(item);
										} else {
											props.node.deselect(item);
										}
									}}
								/>
							}
						/>
					);
				}}
			</For>
		</FormGroup>
	);
};
