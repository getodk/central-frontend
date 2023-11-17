import { Match, Switch, createMemo } from 'solid-js';
import type { AnyControlDefinition } from '../../../lib/xform/body/control/ControlDefinition.ts';
import type { EntryState } from '../../../lib/xform/state/EntryState.ts';
import { XFormRelevanceGuard } from '../XFormRelevanceGuard.tsx';
import { XFormUnknownControl } from '../debugging/XFormUnknownControl.tsx';
import { XFormInputControl, inputControlProps } from './XFormInputControl.tsx';

export interface XFormControlProps {
	readonly control: AnyControlDefinition;
	readonly entry: EntryState;
}

export const XFormControl = (props: XFormControlProps) => {
	const isRelevant = createMemo(() => {
		return props.control.getBinding(props.entry)?.isRelevant() ?? true;
	});

	return (
		<XFormRelevanceGuard isRelevant={isRelevant()}>
			<Switch fallback={<XFormUnknownControl {...props} />}>
				<Match when={inputControlProps(props)} keyed={true}>
					<XFormInputControl entry={props.entry} control={props.control} />
				</Match>
			</Switch>
		</XFormRelevanceGuard>
	);
};
