import { Match, Switch } from 'solid-js';
import {
	controlElementDefinition,
	groupElementDefinition,
	type AnyBodyElementDefinition,
} from '../../lib/xform/body/BodyDefinition.ts';
import type { EntryState } from '../../lib/xform/state/EntryState.ts';
import { XFormGroup } from './containers/XFormGroup.tsx';
import { XFormControl } from './controls/XFormControl.tsx';

interface XFormUnknownElementProps {
	readonly entry: EntryState;
	readonly element: AnyBodyElementDefinition;
}

const XFormUnknownElement = (props: XFormUnknownElementProps) => {
	props;
	return <></>;
};

export interface XFormBodyElementProps {
	readonly entry: EntryState;
	readonly element: AnyBodyElementDefinition;
}

export const XFormBodyElement = (props: XFormBodyElementProps) => {
	return (
		<Switch fallback={<XFormUnknownElement {...props} />}>
			<Match when={groupElementDefinition(props.element)} keyed={true}>
				{(groupElement) => {
					return <XFormGroup entry={props.entry} group={groupElement} />;
				}}
			</Match>
			<Match when={controlElementDefinition(props.element)} keyed={true}>
				{(controlElement) => {
					return <XFormControl entry={props.entry} control={controlElement} />;
				}}
			</Match>
		</Switch>
	);
};
