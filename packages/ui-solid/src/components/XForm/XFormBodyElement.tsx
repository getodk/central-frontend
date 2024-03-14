import type {
	AnyBodyElementDefinition,
	AnyChildState,
	RepeatSequenceState,
	SubtreeState,
	ValueNodeState,
} from '@odk-web-forms/xforms-engine';
import { Match, Switch } from 'solid-js';
import { XFormGroup } from './containers/XFormGroup.tsx';
import { XFormControl } from './controls/XFormControl.tsx';

interface XFormUnknownElementProps {
	readonly state: AnyChildState;
	readonly element: AnyBodyElementDefinition;
}

const XFormUnknownElement = (props: XFormUnknownElementProps) => {
	props;
	return <></>;
};

type GroupState = RepeatSequenceState | SubtreeState;

const groupState = (props: XFormBodyElementProps): GroupState | null => {
	const { state } = props;

	if (state.type === 'value-node') {
		return null;
	}

	return state;
};

const controlState = (props: XFormBodyElementProps): ValueNodeState | null => {
	const { state } = props;

	if (state.type === 'value-node') {
		return state;
	}

	return null;
};

export interface XFormBodyElementProps {
	readonly state: AnyChildState;
	readonly element: AnyBodyElementDefinition;
}

export const XFormBodyElement = (props: XFormBodyElementProps) => {
	return (
		<Switch fallback={<XFormUnknownElement {...props} />}>
			<Match when={groupState(props)} keyed={true}>
				{(state) => <XFormGroup state={state} />}
			</Match>
			<Match when={controlState(props)} keyed={true}>
				{(state) => {
					return <XFormControl state={state} />;
				}}
			</Match>
		</Switch>
	);
};
