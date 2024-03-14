import type {
	AnySelectDefinition,
	SelectDefinition,
	ValueNodeState,
} from '@odk-web-forms/xforms-engine';
import { Match, Switch } from 'solid-js';
import { MultiSelect } from '../../Widget/MultiSelect.tsx';
import { SingleSelect } from '../../Widget/SingleSelect.tsx';

export type Select1Definition = SelectDefinition<'select1'>;

const select1 = (control: AnySelectDefinition): Select1Definition | null => {
	if (control.type === 'select1') {
		return control as Select1Definition;
	}

	return null;
};

export type SelectNDefinition = SelectDefinition<'select'>;

const selectN = (control: AnySelectDefinition): SelectNDefinition | null => {
	if (control.type === 'select') {
		return control as SelectNDefinition;
	}

	return null;
};

interface SelectControlProps {
	readonly control: AnySelectDefinition;
	readonly state: ValueNodeState;
}

export const SelectControl = (props: SelectControlProps) => {
	return (
		<Switch fallback={<p>!</p>}>
			<Match when={select1(props.control)} keyed={true}>
				{(control) => <SingleSelect control={control} state={props.state} />}
			</Match>
			<Match when={selectN(props.control)} keyed={true}>
				{(control) => <MultiSelect control={control} state={props.state} />}
			</Match>
		</Switch>
	);
};
