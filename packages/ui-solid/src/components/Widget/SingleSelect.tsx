import type { ValueNodeState } from '@odk-web-forms/xforms-engine';
import { FormControlLabel, Radio, RadioGroup } from '@suid/material';
import type { ChangeEvent } from '@suid/types';
import { createMemo, For, Show } from 'solid-js';
import type { Select1Definition } from '../XForm/controls/SelectControl.tsx';
import { XFormControlLabel } from '../XForm/controls/XFormControlLabel.tsx';

export interface SingleSelectProps {
	readonly control: Select1Definition;
	readonly state: ValueNodeState;
}

export const SingleSelect = (props: SingleSelectProps) => {
	const selectState = props.state.createSelect(props.control);
	const isDisabled = createMemo(() => {
		return props.state.isReadonly() === true || props.state.isRelevant() === false;
	});
	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		selectState.setValue(event.target.value);
	};

	return (
		<RadioGroup name={props.state.reference} value={props.state.getValue()} onChange={handleChange}>
			<Show when={props.control.label} keyed={true}>
				{(label) => {
					return <XFormControlLabel state={props.state} label={label} />;
				}}
			</Show>
			<For each={selectState.items()}>
				{(item) => {
					return (
						<FormControlLabel
							value={item.value}
							control={<Radio />}
							label={item.label()}
							disabled={isDisabled()}
						/>
					);
				}}
			</For>
		</RadioGroup>
	);
};
