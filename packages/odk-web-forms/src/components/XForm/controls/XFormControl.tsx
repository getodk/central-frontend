import { Match, Switch, createMemo } from 'solid-js';
import type { InputDefinition } from '../../../lib/xform/body/control/InputDefinition.ts';
import type { ValueNodeState } from '../../../lib/xform/state/ValueNodeState.ts';
import { XFormRelevanceGuard } from '../XFormRelevanceGuard.tsx';
import { XFormUnknownControl } from '../debugging/XFormUnknownControl.tsx';
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
			</Switch>
		</XFormRelevanceGuard>
	);
};
