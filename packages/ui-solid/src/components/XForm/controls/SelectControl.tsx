import type { AnySelectDefinition, SelectDefinition, SelectNode } from '@getodk/xforms-engine';
import { Match, Switch } from 'solid-js';
import { MultiSelect } from '../../Widget/MultiSelect.tsx';
import { SingleSelect } from '../../Widget/SingleSelect.tsx';

/**
 * @todo This should have a variant type in the engine's client interface.
 */
export type Select1Definition = SelectDefinition<'select1'>;

const select1 = (control: AnySelectDefinition): Select1Definition | null => {
	if (control.type === 'select1') {
		return control as Select1Definition;
	}

	return null;
};

/**
 * @todo This should have a variant type in the engine's client interface.
 */
export type SelectNDefinition = SelectDefinition<'select'>;

const selectN = (control: AnySelectDefinition): SelectNDefinition | null => {
	if (control.type === 'select') {
		return control as SelectNDefinition;
	}

	return null;
};

interface SelectControlProps {
	readonly node: SelectNode;
}

export const SelectControl = (props: SelectControlProps) => {
	return (
		<Switch fallback={<p>!</p>}>
			<Match when={select1(props.node.definition.bodyElement)} keyed={true}>
				{(control) => <SingleSelect control={control} node={props.node} />}
			</Match>
			<Match when={selectN(props.node.definition.bodyElement)} keyed={true}>
				{(control) => <MultiSelect control={control} node={props.node} />}
			</Match>
		</Switch>
	);
};
