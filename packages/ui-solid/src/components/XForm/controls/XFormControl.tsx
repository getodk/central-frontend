import type {
	AnySelectDefinition,
	InputDefinition,
	ValueNodeState,
} from '@odk-web-forms/xforms-engine';
import { Match, Switch, createMemo } from 'solid-js';
import { XFormRelevanceGuard } from '../XFormRelevanceGuard.tsx';
import { XFormUnknownControl } from '../debugging/XFormUnknownControl.tsx';
import { SelectControl } from './SelectControl.tsx';
import { XFormInputControl } from './XFormInputControl.tsx';

export interface XFormControlProps {
	readonly state: ValueNodeState;
}

const inputContol = (props: XFormControlProps): InputDefinition | null => {
	const { bodyElement } = props.state.definition;

	if (bodyElement?.type === 'input') {
		return bodyElement;
	}

	return null;
};

const selectControl = (props: XFormControlProps): AnySelectDefinition | null => {
	const { bodyElement } = props.state.definition;

	if (bodyElement == null) {
		return null;
	}

	switch (bodyElement.type) {
		case 'rank':
		case 'select':
		case 'select1':
			return bodyElement as AnySelectDefinition;
	}

	return null;
};

export const XFormControl = (props: XFormControlProps) => {
	const isRelevant = createMemo(() => {
		return props.state.isRelevant();
	});

	return (
		<XFormRelevanceGuard isRelevant={isRelevant()}>
			<Switch fallback={<XFormUnknownControl {...props} />}>
				<Match when={inputContol(props)} keyed={true}>
					{(control) => {
						return <XFormInputControl control={control} state={props.state} />;
					}}
				</Match>
				<Match when={selectControl(props)} keyed={true}>
					{(control) => {
						return <SelectControl control={control} state={props.state} />;
					}}
				</Match>
			</Switch>
		</XFormRelevanceGuard>
	);
};
