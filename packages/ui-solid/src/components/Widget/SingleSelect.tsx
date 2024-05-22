import type { SelectNode } from '@getodk/xforms-engine';
import { FormControlLabel, Radio, RadioGroup } from '@suid/material';
import type { ChangeEvent } from '@suid/types';
import { For, Show, createMemo } from 'solid-js';
import type { Select1Definition } from '../XForm/controls/SelectControl.tsx';
import { XFormControlLabel } from '../XForm/controls/XFormControlLabel.tsx';

/**
 * @todo This should have a variant type in the engine's client interface.
 */
export interface SingleSelectProps {
	readonly control: Select1Definition;
	readonly node: SelectNode;
}

export const SingleSelect = (props: SingleSelectProps) => {
	const isDisabled = createMemo(() => {
		return props.node.currentState.readonly || !props.node.currentState.relevant;
	});
	const selectedItem = () => {
		const [item] = props.node.currentState.value;

		return item;
	};
	const getItem = (value: string) => {
		return props.node.currentState.valueOptions.find((item) => {
			return item.value === value;
		});
	};
	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		const item = getItem(event.target.value);

		if (item == null) {
			const currentItem = selectedItem();

			if (currentItem != null) {
				props.node.deselect(currentItem);
			}
		} else {
			props.node.select(item);
		}
	};
	const value = () => {
		const [item] = props.node.currentState.value;

		return item?.value ?? null;
	};

	return (
		<RadioGroup name={props.node.currentState.reference} value={value()} onChange={handleChange}>
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
							value={item.value}
							control={<Radio />}
							label={label()}
							disabled={isDisabled()}
						/>
					);
				}}
			</For>
		</RadioGroup>
	);
};
